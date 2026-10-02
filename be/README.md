# Backend development

From the repository root, start the backend with:

```sh
./be/run.sh
```

The script applies database migrations, creates any missing accounts from
`seed/users.json`, and starts Django on `0.0.0.0:8000`. Existing accounts are
left unchanged, so running the script again does not create duplicate users or
reset their passwords. To use a different local address or port, pass Django's
`runserver` arguments, for example `./be/run.sh 127.0.0.1:8001`.

The seed file contains development credentials. Do not use those credentials
for a production deployment.
