---
name: security-guidance
description: Security reminder hook that warns about potential security issues when editing files, including command injection, XSS, unsafe code patterns, and GitHub Actions workflow vulnerabilities.
---

# Security Guidance

This plugin provides a PreToolUse hook that automatically checks for security patterns when editing files. It detects:

- **GitHub Actions workflow injection** (command injection via untrusted inputs)
- **child_process.exec** command injection risks
- **new Function()** code injection
- **eval()** arbitrary code execution
- **dangerouslySetInnerHTML** XSS vulnerabilities
- **document.write()** XSS attacks
- **innerHTML** XSS vulnerabilities
- **pickle** deserialization risks
- **os.system** command injection

The hook runs automatically on Edit, Write, and MultiEdit operations. Warnings are shown once per file per session to avoid noise.

Set `ENABLE_SECURITY_REMINDER=0` to disable.
