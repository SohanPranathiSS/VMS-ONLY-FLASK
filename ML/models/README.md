# ML Service Models

This directory contains trained model files and configurations.

## Structure

- `easyocr/` - EasyOCR model files and configurations
- `gemini/` - Gemini API configurations
- `custom/` - Custom trained models
- `configs/` - Model configuration files

## Model Versioning

Models should be versioned for better management:
- `v1.0/` - Initial model versions
- `v1.1/` - Updated model versions
- `latest/` - Symlink to latest stable version

## Usage

The ML service automatically loads models from this directory. Ensure proper file permissions and accessibility.

## Supported Model Formats

- EasyOCR: .pth files
- Custom models: .pkl, .joblib, .h5 formats
- Configuration: .json, .yaml formats
