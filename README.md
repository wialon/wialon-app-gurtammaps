# Gurtam Maps, version 1.2.2: (April 1, 2025)
This is WEB application based on Apps from Gurtam (http://apps.wialon.com).

**This is a legacy app: it is no longer developed or maintained. The code is published as is, without support.**

## Description
In its basic implementation, the application can be used in two ways:
- to search location and address by given coordinates;
- to search location and coordinates by given address or its part.

## License
[The MIT License](LICENSE-MIT)

## Requirements
 * Browser: a current version of Google Chrome, Firefox, Safari or Edge
 * Language: en, br, es, fa, pt, ru
 * Components: SDK
 * URL params: Active SID, Base URL, Host URL, Language

## Quick start
Apps activation through the management system: https://help.wialon.com/en/wialon-hosting/user-guide/management-system/apps  
Working with applications in the GPS tracking system: https://help.wialon.com/en/wialon-hosting/user-guide/monitoring-system/apps

## Installation
The repository contains the app in the form it is hosted in. Put the files on a web server and open `index.html` with the URL params listed above, for example
`index.html?sid=<Active SID>&baseUrl=https://hst-api.wialon.com&lang=en`.

 * On start the page requests `/gurtammaps/app/app.json` and the optional `/gurtammaps/whitelabel.json` (white label settings) by absolute paths, so host the app under the `/gurtammaps/` path to have them picked up.
 * The Gurtam Maps tile layer for Leaflet is loaded from `//apps.wialon.com/plugins/`.
