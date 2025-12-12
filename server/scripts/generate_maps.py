#!/usr/bin/env python3
"""
Map generation worker for PsyVis Lab.

Generates depth, normal, edge, and mask maps from input images.
Outputs JSON metadata to stdout and PNG files to the output directory.

Usage:
    python generate_maps.py --input <path> --output-dir <path> --maps depth,normals,edges,faceMask,handsMask

Dependencies:
    pip install opencv-python-headless numpy mediapipe

For depth estimation (optional but recommended):
    pip install torch torchvision
    # Then install depth-anything-v2 from: https://github.com/DepthAnything/Depth-Anything-V2
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np

# ─────────────────────────────────────────────────────────────────────────────
# Conditional imports for optional features
# ─────────────────────────────────────────────────────────────────────────────

DEPTH_AVAILABLE = False
MEDIAPIPE_AVAILABLE = False

try:
    import torch
    # Check if Depth Anything V2 is available
    try:
        from depth_anything_v2.dpt import DepthAnythingV2
        DEPTH_AVAILABLE = True
    except ImportError:
        # Try alternative import paths
        try:
            sys.path.insert(0, str(Path(__file__).parent / 'Depth-Anything-V2'))
            from depth_anything_v2.dpt import DepthAnythingV2
            DEPTH_AVAILABLE = True
        except ImportError:
            pass
except ImportError:
    pass

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    pass


# ─────────────────────────────────────────────────────────────────────────────
# Depth Map Generation
# ─────────────────────────────────────────────────────────────────────────────

def compute_depth_map_ml(image: np.ndarray, model_size: str = 'vits') -> np.ndarray:
    """Generate depth map using Depth Anything V2."""
    if not DEPTH_AVAILABLE:
        raise RuntimeError("Depth Anything V2 not installed. Run setup_maps_env.sh first.")

    device = 'cuda' if torch.cuda.is_available() else 'mps' if torch.backends.mps.is_available() else 'cpu'

    model_configs = {
        'vits': {'encoder': 'vits', 'features': 64, 'out_channels': [48, 96, 192, 384]},
        'vitb': {'encoder': 'vitb', 'features': 128, 'out_channels': [96, 192, 384, 768]},
        'vitl': {'encoder': 'vitl', 'features': 256, 'out_channels': [256, 512, 1024, 1024]},
    }

    if model_size not in model_configs:
        model_size = 'vits'

    model = DepthAnythingV2(**model_configs[model_size])

    # Look for checkpoint in multiple locations
    script_dir = Path(__file__).parent
    checkpoint_paths = [
        script_dir / 'checkpoints' / f'depth_anything_v2_{model_size}.pth',
        script_dir / f'depth_anything_v2_{model_size}.pth',
        Path.home() / '.cache' / 'depth_anything_v2' / f'depth_anything_v2_{model_size}.pth',
    ]

    checkpoint_path = None
    for cp in checkpoint_paths:
        if cp.exists():
            checkpoint_path = cp
            break

    if checkpoint_path:
        model.load_state_dict(torch.load(str(checkpoint_path), map_location='cpu'))
    else:
        print(f"Warning: No checkpoint found for {model_size}. Using uninitialized weights.", file=sys.stderr)

    model = model.to(device).eval()

    # Convert BGR to RGB for the model
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    with torch.no_grad():
        depth = model.infer_image(rgb_image)

    # Normalize to 0-255 (closer = brighter)
    depth_normalized = ((depth - depth.min()) / (depth.max() - depth.min() + 1e-8) * 255).astype(np.uint8)
    return depth_normalized


def compute_depth_map_simple(image: np.ndarray) -> np.ndarray:
    """Simple depth approximation using edge density and blur estimation.

    This is a fallback when ML models are not available.
    Not accurate but provides some structural guidance.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    # Use Laplacian variance as a rough depth cue (sharp = closer)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    laplacian_var = cv2.GaussianBlur(np.abs(laplacian).astype(np.float32), (31, 31), 0)

    # Normalize
    depth = ((laplacian_var - laplacian_var.min()) / (laplacian_var.max() - laplacian_var.min() + 1e-8) * 255)
    return depth.astype(np.uint8)


def compute_depth_map(image: np.ndarray) -> tuple[np.ndarray, str]:
    """Generate depth map using best available method."""
    if DEPTH_AVAILABLE:
        try:
            depth = compute_depth_map_ml(image, 'vits')
            return depth, 'depth-anything-v2-vits'
        except Exception as e:
            print(f"Warning: ML depth failed ({e}), falling back to simple method", file=sys.stderr)

    depth = compute_depth_map_simple(image)
    return depth, 'simple-laplacian'


# ─────────────────────────────────────────────────────────────────────────────
# Normal Map Generation
# ─────────────────────────────────────────────────────────────────────────────

def compute_normals_from_depth(depth: np.ndarray) -> np.ndarray:
    """Compute surface normals from depth map using Sobel gradients."""
    depth_float = depth.astype(np.float32) / 255.0

    # Compute gradients
    dzdx = cv2.Sobel(depth_float, cv2.CV_32F, 1, 0, ksize=3)
    dzdy = cv2.Sobel(depth_float, cv2.CV_32F, 0, 1, ksize=3)

    # Compute normal vectors (scale Z component for better visualization)
    z_scale = 0.5
    normal = np.dstack((-dzdx, -dzdy, np.ones_like(depth_float) * z_scale))
    norm = np.linalg.norm(normal, axis=2, keepdims=True)
    normal = normal / (norm + 1e-8)

    # Convert to 0-255 RGB (map [-1,1] to [0,255])
    normal_rgb = ((normal + 1) * 0.5 * 255).astype(np.uint8)

    # OpenCV uses BGR, so swap R and B for correct display
    normal_bgr = cv2.cvtColor(normal_rgb, cv2.COLOR_RGB2BGR)
    return normal_bgr


# ─────────────────────────────────────────────────────────────────────────────
# Edge Map Generation
# ─────────────────────────────────────────────────────────────────────────────

def compute_edges(image: np.ndarray) -> np.ndarray:
    """Compute Canny edge map with automatic threshold selection."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

    # Apply slight blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)

    # Auto threshold based on median
    median = np.median(blurred)
    sigma = 0.33
    low = int(max(0, (1.0 - sigma) * median))
    high = int(min(255, (1.0 + sigma) * median))

    edges = cv2.Canny(blurred, low, high)
    return edges


# ─────────────────────────────────────────────────────────────────────────────
# Face Mask Generation
# ─────────────────────────────────────────────────────────────────────────────

def compute_face_mask(image: np.ndarray) -> np.ndarray:
    """Generate face region mask using MediaPipe Face Mesh."""
    if not MEDIAPIPE_AVAILABLE:
        raise RuntimeError("MediaPipe not installed. Run: pip install mediapipe")

    mp_face_mesh = mp.solutions.face_mesh
    mask = np.zeros(image.shape[:2], dtype=np.uint8)

    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=10,
        refine_landmarks=True,
        min_detection_confidence=0.5
    ) as face_mesh:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_image)

        if results.multi_face_landmarks:
            h, w = image.shape[:2]
            for face_landmarks in results.multi_face_landmarks:
                # Get all face landmark points
                points = []
                for landmark in face_landmarks.landmark:
                    x = int(landmark.x * w)
                    y = int(landmark.y * h)
                    points.append([x, y])

                points = np.array(points, dtype=np.int32)

                # Create convex hull of face landmarks
                hull = cv2.convexHull(points)
                cv2.fillConvexPoly(mask, hull, 255)

    # Dilate slightly to ensure full coverage
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=2)

    return mask


# ─────────────────────────────────────────────────────────────────────────────
# Hands Mask Generation
# ─────────────────────────────────────────────────────────────────────────────

def compute_hands_mask(image: np.ndarray) -> np.ndarray:
    """Generate hands region mask using MediaPipe Hands."""
    if not MEDIAPIPE_AVAILABLE:
        raise RuntimeError("MediaPipe not installed. Run: pip install mediapipe")

    mp_hands = mp.solutions.hands
    mask = np.zeros(image.shape[:2], dtype=np.uint8)

    with mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=4,
        min_detection_confidence=0.5
    ) as hands:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_image)

        if results.multi_hand_landmarks:
            h, w = image.shape[:2]
            for hand_landmarks in results.multi_hand_landmarks:
                points = []
                for landmark in hand_landmarks.landmark:
                    x = int(landmark.x * w)
                    y = int(landmark.y * h)
                    points.append([x, y])

                points = np.array(points, dtype=np.int32)

                # Create convex hull of hand landmarks
                hull = cv2.convexHull(points)
                cv2.fillConvexPoly(mask, hull, 255)

    # Dilate more aggressively to include full hand area
    kernel = np.ones((15, 15), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=2)

    return mask


# ─────────────────────────────────────────────────────────────────────────────
# Segmentation Map Generation
# ─────────────────────────────────────────────────────────────────────────────

def compute_segmentation_mask(image: np.ndarray) -> np.ndarray:
    """Generate a rough foreground/background segmentation mask using GrabCut.

    This is a lightweight, dependency-free segmentation fallback.
    White = foreground, Black = background.
    """
    h, w = image.shape[:2]
    if h <= 2 or w <= 2:
        return np.zeros((h, w), dtype=np.uint8)

    # Initialize with a central rectangle, leaving a margin.
    margin_x = max(10, int(w * 0.05))
    margin_y = max(10, int(h * 0.05))
    rect = (margin_x, margin_y, max(1, w - 2 * margin_x), max(1, h - 2 * margin_y))

    mask = np.zeros((h, w), np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    # Run GrabCut; 3 iterations is usually enough for a coarse mask.
    cv2.grabCut(image, mask, rect, bgdModel, fgdModel, 3, cv2.GC_INIT_WITH_RECT)

    # Convert GrabCut labels to binary mask.
    # 0/2 = background/prob background, 1/3 = foreground/prob foreground
    is_fg = (mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)
    out = np.where(is_fg, 255, 0).astype('uint8')

    # Mild morphology to clean speckle.
    kernel = np.ones((3, 3), np.uint8)
    out = cv2.morphologyEx(out, cv2.MORPH_OPEN, kernel, iterations=1)
    out = cv2.morphologyEx(out, cv2.MORPH_CLOSE, kernel, iterations=2)

    return out


# ─────────────────────────────────────────────────────────────────────────────
# Main Entry Point
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Generate control maps for PsyVis Lab')
    parser.add_argument('--input', required=True, help='Input image path')
    parser.add_argument('--output-dir', required=True, help='Output directory')
    parser.add_argument('--maps', default='depth,edges,faceMask,handsMask',
                        help='Comma-separated list of maps to generate')
    parser.add_argument('--max-dimension', type=int, default=1024,
                        help='Maximum dimension for processing')
    args = parser.parse_args()

    requested_maps = [m.strip() for m in args.maps.split(',')]
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # Load image
    image = cv2.imread(args.input)
    if image is None:
        print(json.dumps({'error': f'Could not load image: {args.input}'}))
        sys.exit(1)

    # Resize if needed
    h, w = image.shape[:2]
    if max(h, w) > args.max_dimension:
        scale = args.max_dimension / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        h, w = new_h, new_w

    # Save resized input
    input_path = output_dir / 'input.png'
    cv2.imwrite(str(input_path), image)

    results = {
        'maps': [],
        'sourceWidth': w,
        'sourceHeight': h,
        'inputFilename': 'input.png'
    }

    depth_map = None

    # Generate requested maps
    for map_type in requested_maps:
        try:
            if map_type == 'depth':
                depth_map, model_used = compute_depth_map(image)
                cv2.imwrite(str(output_dir / 'depth.png'), depth_map)
                results['maps'].append({
                    'kind': 'depth',
                    'filename': 'depth.png',
                    'width': w,
                    'height': h,
                    'generatedAt': datetime.now(timezone.utc).isoformat(),
                    'modelUsed': model_used
                })

            elif map_type == 'normals':
                # Generate depth first if not already done
                if depth_map is None:
                    depth_map, _ = compute_depth_map(image)
                normals = compute_normals_from_depth(depth_map)
                cv2.imwrite(str(output_dir / 'normals.png'), normals)
                results['maps'].append({
                    'kind': 'normals',
                    'filename': 'normals.png',
                    'width': w,
                    'height': h,
                    'generatedAt': datetime.now(timezone.utc).isoformat(),
                    'modelUsed': 'sobel-from-depth'
                })

            elif map_type == 'edges':
                edges = compute_edges(image)
                cv2.imwrite(str(output_dir / 'edges.png'), edges)
                results['maps'].append({
                    'kind': 'edges',
                    'filename': 'edges.png',
                    'width': w,
                    'height': h,
                    'generatedAt': datetime.now(timezone.utc).isoformat(),
                    'modelUsed': 'canny-auto'
                })

            elif map_type == 'segmentation':
                seg = compute_segmentation_mask(image)
                cv2.imwrite(str(output_dir / 'segmentation.png'), seg)
                results['maps'].append({
                    'kind': 'segmentation',
                    'filename': 'segmentation.png',
                    'width': w,
                    'height': h,
                    'generatedAt': datetime.now(timezone.utc).isoformat(),
                    'modelUsed': 'opencv-grabcut'
                })

            elif map_type == 'faceMask':
                face_mask = compute_face_mask(image)
                cv2.imwrite(str(output_dir / 'faceMask.png'), face_mask)
                results['maps'].append({
                    'kind': 'faceMask',
                    'filename': 'faceMask.png',
                    'width': w,
                    'height': h,
                    'generatedAt': datetime.now(timezone.utc).isoformat(),
                    'modelUsed': 'mediapipe-face-mesh'
                })

            elif map_type == 'handsMask':
                hands_mask = compute_hands_mask(image)
                cv2.imwrite(str(output_dir / 'handsMask.png'), hands_mask)
                results['maps'].append({
                    'kind': 'handsMask',
                    'filename': 'handsMask.png',
                    'width': w,
                    'height': h,
                    'generatedAt': datetime.now(timezone.utc).isoformat(),
                    'modelUsed': 'mediapipe-hands'
                })

        except Exception as e:
            print(f'Warning: Failed to generate {map_type}: {e}', file=sys.stderr)

    # Output JSON result to stdout
    print(json.dumps(results))


if __name__ == '__main__':
    main()
