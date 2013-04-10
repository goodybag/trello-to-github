# GitHub oAuth Proxy

proxy github oauth token requests to preserve client_secret for client-side apps, such as browser extensions and static pages.

## Configuration

Create a `config.json` file in the same directory as server.js which looks like this:

```json
{
  "client_id":"[your github application client id]",
  "client_secret":"[your github application client secret]"
}
```

## Use

`npm start`

Then make an `application/json` POST request to the server containing the [temporary code](http://developer.github.com/v3/oauth/#web-application-flow) github gave you:

```json
{
  "code":"[your code]"
}
```