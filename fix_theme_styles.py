#!/usr/bin/env python3
"""
Script to fix 'theme is not defined' errors by converting static StyleSheets to dynamic ones.
"""

import re
import sys

def fix_styles_file(filepath):
    """Fix a single file by converting static StyleSheet to dynamic createStyles."""

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Pattern 1: Find useTenantTheme() call - we need to add styles call after this
    # Look for patterns like:
    # const theme = useTenantTheme();
    # const { theme } = useTenantTheme();
    # const { theme: tenantTheme } = useTenantTheme();

    # First, check if styles call already exists
    if 'const styles = createStyles(' in content:
        print(f"✓ {filepath} - Already has createStyles call")
        return False

    # Find the component function and where to add styles call
    # Pattern: Look for useTenantTheme() and add styles call after it
    theme_patterns = [
        (r'(const { theme } = useTenantTheme\(\);)', r'\1\n  const styles = createStyles(theme);'),
        (r'(const theme = useTenantTheme\(\);)', r'\1\n  const styles = createStyles(theme.theme);'),
        (r'(const { theme: tenantTheme } = useTenantTheme\(\);)', r'\1\n  const theme = tenantTheme;\n  const notify = useNotification();\n  const styles = createStyles(theme);'),
    ]

    styles_added = False
    for pattern, replacement in theme_patterns:
        if re.search(pattern, content):
            # Special handling for different patterns
            if '{ theme: tenantTheme }' in pattern:
                # Already has theme aliasing, add after notify
                content = re.sub(
                    r'(const { theme: tenantTheme } = useTenantTheme\(\);\n  const theme = tenantTheme;\n  const notify = useNotification\(\);)',
                    r'\1\n  const styles = createStyles(theme);',
                    content
                )
            elif '{ theme }' in pattern:
                content = re.sub(pattern, replacement, content)
            else:
                content = re.sub(pattern, replacement, content)
            styles_added = True
            break

    if not styles_added:
        print(f"✗ {filepath} - Could not find useTenantTheme() pattern")
        return False

    # Pattern 2: Find and extract the StyleSheet.create block
    # Look for: const styles = StyleSheet.create({ ... });
    # OR:       const styles = StyleSheet.create({ (inside component, before return)

    # Find the styles definition
    styles_match = re.search(
        r'\n  const styles = StyleSheet\.create\(\{(.*?)\n  \}\);',
        content,
        re.DOTALL
    )

    if not styles_match:
        print(f"✗ {filepath} - Could not find StyleSheet.create block")
        return False

    styles_content = styles_match.group(1)
    full_styles_block = styles_match.group(0)

    # Remove the styles block from inside the component
    content = content.replace(full_styles_block, '')

    # Find the component closing (}; before export)
    # Look for the pattern: closing brace of component function
    component_end_match = re.search(r'\n\};(\n\n(?:const createStyles|export default))', content)

    if not component_end_match:
        print(f"✗ {filepath} - Could not find component end")
        return False

    # Insert the createStyles function after the component
    create_styles_func = f'''

const createStyles = (theme: any) => StyleSheet.create({{
{styles_content}
  }});'''

    # Insert before the export or next const
    content = content.replace(
        component_end_match.group(0),
        f'\n}};{create_styles_func}{component_end_match.group(1)}'
    )

    # Only write if content changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✓ {filepath} - Fixed successfully")
        return True
    else:
        print(f"- {filepath} - No changes needed")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python fix_theme_styles.py <filepath1> [filepath2] ...")
        sys.exit(1)

    files = sys.argv[1:]
    fixed_count = 0

    for filepath in files:
        try:
            if fix_styles_file(filepath):
                fixed_count += 1
        except Exception as e:
            print(f"✗ {filepath} - Error: {e}")

    print(f"\nFixed {fixed_count} out of {len(files)} files")
