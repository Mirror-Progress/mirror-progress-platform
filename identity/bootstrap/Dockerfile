FROM 380314682150.dkr.ecr.us-east-1.amazonaws.com/mirror-identity-staging@sha256:54b03b755b0e9784102c05a17399810b1794c28e73ec3325c619bc2861b80324
COPY first-owner.mjs /app/bootstrap/first-owner.mjs
RUN node --check /app/bootstrap/first-owner.mjs
CMD ["node","/app/bootstrap/first-owner.mjs"]
