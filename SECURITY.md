# Security policy

## Supported versions

Only the latest 2.x release receives security fixes.

## Reporting a vulnerability

Do not open a public issue. Use GitHub's private vulnerability reporting: open the **Security** tab of this repository and choose **Report a vulnerability**. The maintainer aims to reply within 7 days.

## In scope

- Rules in the standard that would lead to an insecure site if followed as written (for example a wrong header value or a secret handled in the public configuration).
- The `ds7` CLI writing files outside the project, or following symbolic links to unexpected places.

## Out of scope

- A specific site built with DS7. Report those to the site's owner.
