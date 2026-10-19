# Serverless v3 can't read sso-session profiles, so hand it temporary credentials.
# Logs in first if the SSO session has expired.
aws sts get-caller-identity >/dev/null 2>&1 || aws sso login || exit 1
eval "$(aws configure export-credentials --format env)" || exit 1
