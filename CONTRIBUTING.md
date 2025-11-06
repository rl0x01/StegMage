# Contributing to StegMage

Thank you for your interest in contributing to StegMage! We welcome contributions from the community.

## How to Contribute

1. **Fork the Repository**
   - Fork the StegMage repository to your GitHub account

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/StegMage.git
   cd StegMage
   ```

3. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make Your Changes**
   - Write clean, readable code
   - Follow the existing code style
   - Add comments where necessary
   - Test your changes thoroughly

5. **Run Tests and Linters**
   ```bash
   # Install dev dependencies
   pip install -r requirements-dev.txt

   # Run linters
   black .
   flake8 .
   pylint app/
   mypy app/

   # Run tests (when available)
   pytest
   ```

6. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add: description of your feature"
   ```

7. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request**
   - Go to the original StegMage repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Describe your changes in detail

## Types of Contributions

### 🐛 Bug Reports
- Use the GitHub issue tracker
- Include steps to reproduce
- Provide example images if possible

### ✨ Feature Requests
- Describe the feature clearly
- Explain the use case
- Discuss implementation ideas

### 🔧 Code Contributions
- Add new analyzers
- Improve existing analyzers
- Enhance the UI/UX
- Optimize performance
- Fix bugs

### 📚 Documentation
- Improve README
- Add code comments
- Write tutorials
- Create examples

## Code Style

- Follow PEP 8 for Python code
- Use type hints where possible
- Write descriptive variable names
- Add docstrings to functions and classes
- Keep functions focused and small

## Adding New Analyzers

To add a new steganography analyzer:

1. Create a new file in `analyzers/` directory
2. Inherit from `BaseAnalyzer` class
3. Implement the `analyze()` method
4. Add your analyzer to `workers/analyzer.py`
5. Update the frontend to display results

Example:

```python
from .base import BaseAnalyzer

class MyAnalyzer(BaseAnalyzer):
    def analyze(self, filepath: str, output_dir: str) -> dict:
        # Your analysis logic here
        return {'result': 'data'}
```

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Keep discussions professional

## Questions?

Feel free to open an issue for any questions or clarifications!

---

Thank you for contributing to StegMage! 🔮
