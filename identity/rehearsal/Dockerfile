FROM 380314682150.dkr.ecr.us-east-1.amazonaws.com/mirror-identity-staging@sha256:eb2b2bd5381b67c7f5bba5455afaa1168357cfed0b8d2bed254edcdb409d170b AS application
FROM 380314682150.dkr.ecr.us-east-1.amazonaws.com/mirror-identity-staging@sha256:dcac3d887942400a607260e820e9099332259ebaf14ea5765121e5bdfabafca1
COPY --from=application /app/node_modules/mongodb /application/node_modules/mongodb
COPY --from=application /app/node_modules/bson /application/node_modules/bson
COPY --from=application /app/node_modules/mongodb-connection-string-url /application/node_modules/mongodb-connection-string-url
COPY --from=application /app/node_modules/@mongodb-js/saslprep /application/node_modules/@mongodb-js/saslprep
COPY --from=application /app/node_modules/memory-pager /application/node_modules/memory-pager
COPY --from=application /app/node_modules/sparse-bitfield /application/node_modules/sparse-bitfield
COPY --from=application /app/node_modules/whatwg-url /application/node_modules/whatwg-url
COPY --from=application /app/node_modules/webidl-conversions /application/node_modules/webidl-conversions
COPY --from=application /app/node_modules/tr46 /application/node_modules/tr46
COPY --from=application /app/node_modules/punycode /application/node_modules/punycode
COPY aws-staging.mjs /app/rehearsal/aws-staging.mjs
RUN node --check /app/rehearsal/aws-staging.mjs
CMD ["node", "/app/rehearsal/aws-staging.mjs"]
