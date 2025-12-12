#!/bin/bash
#
# Setup script for PsyVis Lab map generation environment
#
# This script creates a Python virtual environment and installs
# the dependencies needed for map generation (depth, edges, face/hands masks).
#
# Usage:
#   ./setup_maps_env.sh
#
# After running this script, activate the environment with:
#   source .venv/bin/activate
#
# Or set MAPS_PYTHON_PATH in your .env to:
#   MAPS_PYTHON_PATH=./server/scripts/.venv/bin/python3
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
CHECKPOINTS_DIR="$SCRIPT_DIR/checkpoints"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           PsyVis Lab Map Generation Setup                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is required but not found."
    echo "Please install Python 3.9 or later."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "Found Python $PYTHON_VERSION"

# Create virtual environment
echo ""
echo "Step 1: Creating virtual environment at $VENV_DIR..."
if [ -d "$VENV_DIR" ]; then
    echo "  Virtual environment already exists. Skipping creation."
else
    python3 -m venv "$VENV_DIR"
    echo "  Virtual environment created."
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo ""
echo "Step 2: Upgrading pip..."
pip install --upgrade pip --quiet

# Install base dependencies
echo ""
echo "Step 3: Installing base dependencies..."
pip install --quiet \
    opencv-python-headless \
    numpy \
    pillow \
    mediapipe

echo "  Base dependencies installed."

# Install PyTorch (for Depth Anything V2)
echo ""
echo "Step 4: Installing PyTorch..."

# Detect platform and install appropriate PyTorch version
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - use MPS (Metal) if available
    pip install --quiet torch torchvision
    echo "  PyTorch installed (macOS with MPS support)."
else
    # Linux - check for CUDA
    if command -v nvidia-smi &> /dev/null; then
        pip install --quiet torch torchvision --index-url https://download.pytorch.org/whl/cu121
        echo "  PyTorch installed (Linux with CUDA support)."
    else
        pip install --quiet torch torchvision --index-url https://download.pytorch.org/whl/cpu
        echo "  PyTorch installed (CPU only)."
    fi
fi

# Clone and install Depth Anything V2
echo ""
echo "Step 5: Setting up Depth Anything V2..."

DEPTH_ANYTHING_DIR="$SCRIPT_DIR/Depth-Anything-V2"
if [ -d "$DEPTH_ANYTHING_DIR" ]; then
    echo "  Depth Anything V2 directory already exists."
else
    echo "  Cloning Depth Anything V2 repository..."
    git clone --depth 1 https://github.com/DepthAnything/Depth-Anything-V2.git "$DEPTH_ANYTHING_DIR"
fi

# Install Depth Anything V2 package
cd "$DEPTH_ANYTHING_DIR"
pip install --quiet -e .
cd "$SCRIPT_DIR"

echo "  Depth Anything V2 installed."

# Download model checkpoint
echo ""
echo "Step 6: Downloading Depth Anything V2 checkpoint..."

mkdir -p "$CHECKPOINTS_DIR"
CHECKPOINT_FILE="$CHECKPOINTS_DIR/depth_anything_v2_vits.pth"

if [ -f "$CHECKPOINT_FILE" ]; then
    echo "  Checkpoint already exists at $CHECKPOINT_FILE"
else
    echo "  Downloading depth_anything_v2_vits.pth (~99MB)..."

    # Try multiple download methods
    CHECKPOINT_URL="https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth"

    if command -v curl &> /dev/null; then
        curl -L -o "$CHECKPOINT_FILE" "$CHECKPOINT_URL" --progress-bar
    elif command -v wget &> /dev/null; then
        wget -O "$CHECKPOINT_FILE" "$CHECKPOINT_URL" -q --show-progress
    else
        echo "  Error: Neither curl nor wget found. Please download manually from:"
        echo "  $CHECKPOINT_URL"
        echo "  And save to: $CHECKPOINT_FILE"
    fi

    if [ -f "$CHECKPOINT_FILE" ]; then
        echo "  Checkpoint downloaded successfully."
    fi
fi

# Verify installation
echo ""
echo "Step 7: Verifying installation..."

python3 -c "
import cv2
import numpy as np
import mediapipe as mp
print('  ✓ OpenCV:', cv2.__version__)
print('  ✓ NumPy:', np.__version__)
print('  ✓ MediaPipe: installed')

try:
    import torch
    print('  ✓ PyTorch:', torch.__version__)

    if torch.cuda.is_available():
        print('    GPU: CUDA available')
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
        print('    GPU: MPS (Apple Silicon) available')
    else:
        print('    GPU: Using CPU')
except ImportError:
    print('  ⚠ PyTorch: not installed (depth estimation limited)')

try:
    from depth_anything_v2.dpt import DepthAnythingV2
    print('  ✓ Depth Anything V2: available')
except ImportError:
    print('  ⚠ Depth Anything V2: not available (fallback depth will be used)')
"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "To use the map generation:"
echo ""
echo "1. Add to your .env file:"
echo "   MAPS_PYTHON_PATH=$VENV_DIR/bin/python3"
echo ""
echo "2. Or activate the environment manually:"
echo "   source $VENV_DIR/bin/activate"
echo ""
echo "3. Test map generation:"
echo "   $VENV_DIR/bin/python3 $SCRIPT_DIR/generate_maps.py --help"
echo ""
