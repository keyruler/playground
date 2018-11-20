# playground
Simple prototypes

## Potentially useful links
Audit log of the actual key server will be crucial: https://github.com/paragonie/chronicle

A somewhat interesting stackexchange discussion about the lack of standardized ways of how to concat AES/GCM components: https://security.stackexchange.com/a/53703

Other things to consider when building the first server POC will be how to delete keys properly when they expire/are deleted (sqllite secure delete) and what REST framework to use. No need for sessions, but SSL client certs for sure. Fastify?
