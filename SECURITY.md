# Security Policy

## 🚨 Security Incident Report

### Incident: Exposed Database Password in Git History

**Date Discovered:** May 12, 2026  
**Severity:** High  
**Status:** Remediation in progress  

#### Details
A database password was accidentally committed to the repository in commit `5821bedfe47d4ac766480b32116d65e49053488b` in the file `backend/app/database.py`:

```
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:NewStrongPassword_9982!@db/licensewatch")
```

This password is now visible in the public repository's git history.

#### Actions Taken
1. ✅ Replaced with dummy password in subsequent commit
2. ✅ Added enhanced `.gitignore` to prevent future credential commits
3. ✅ Added pre-commit hooks with secret detection
4. ⏳ Pending: Git history rewrite to remove exposed password

---

## Security Best Practices

### Credentials Management
- **Never commit secrets**: Use environment variables instead
- **Use `.env` files locally**: Add them to `.gitignore`
- **Rotate exposed credentials immediately**: Any password visible in git history should be changed
- **Use secure vaults**: Consider using AWS Secrets Manager, HashiCorp Vault, or similar services

### Setting Up Secret Detection Locally

#### 1. Install Pre-commit Framework
```bash
pip install pre-commit
```

#### 2. Install the Hooks
```bash
pre-commit install
```

#### 3. Initialize Secret Baseline
```bash
pip install detect-secrets
detect-secrets scan > .secrets.baseline
```

#### 4. (Optional) Run Against All Files
```bash
pre-commit run --all-files
```

### Environment Variable Template

Create `backend/.env.example` (no actual secrets):
```env
DATABASE_URL=postgresql://user:password@localhost/licensewatch
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-secret-key-here
STRIPE_API_KEY=your-stripe-key-here
```

---

## Reporting Security Vulnerabilities

If you discover a security vulnerability in this repository:

1. **Do NOT open a public GitHub issue**
2. **Email the maintainer** at: 118656715+Siddesh3108@users.noreply.github.com
3. **Include details**: 
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

Allow 48 hours for an initial response.

---

## Removing Secrets from Git History

If you need to remove the exposed password from the entire git history:

```bash
# Install git-filter-repo
pip install git-filter-repo

# Navigate to your local clone
cd office-management

# Replace the exposed password across all commits
git filter-repo --replace-text <(echo 'NewStrongPassword_9982!=dummy_password')

# Force push to remote (after notifying team)
git push origin --force-all
```

⚠️ **Warning**: This operation:
- Rewrites the entire git history
- Requires notification to all team members
- Forces everyone to re-clone or manually update their local repos
- Cannot be undone if not backed up

---

## Tools & Resources

- [detect-secrets](https://github.com/Yelp/detect-secrets) - Secret detection before commit
- [git-secrets](https://github.com/awslabs/git-secrets) - AWS git-secrets tool
- [pre-commit hooks](https://pre-commit.com/) - Git hook framework
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## Security Checklist for Contributors

- [ ] Never commit `.env` files
- [ ] Never commit private keys, certificates, or API keys
- [ ] Run `git status` before committing to check for sensitive files
- [ ] Use pre-commit hooks to catch secrets automatically
- [ ] Review the diff before pushing: `git diff --cached`
- [ ] If you accidentally commit a secret, rotate it immediately

---

Last Updated: May 12, 2026
