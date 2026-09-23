FROM 380314682150.dkr.ecr.us-east-1.amazonaws.com/mirror-identity-staging@sha256:dcac3d887942400a607260e820e9099332259ebaf14ea5765121e5bdfabafca1 AS identity
FROM 380314682150.dkr.ecr.us-east-1.amazonaws.com/mirror-identity-staging@sha256:eb2b2bd5381b67c7f5bba5455afaa1168357cfed0b8d2bed254edcdb409d170b
COPY --from=identity /app/certs/aws-rds-global-bundle.pem /app/reconciliation/rds.pem
COPY *.mjs /app/reconciliation/
RUN node --test /app/reconciliation/parity.test.mjs && node --check /app/reconciliation/production.mjs
CMD ["node","/app/reconciliation/production.mjs"]
