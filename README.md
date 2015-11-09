# RikiTrakiWS

This repository contains the code for the web services supporting RikiTraki, a hiking log web application: [RikiTraki.com](http://rikitraki.com/TestDB). Web Services and database are hosted in OpenShift. The data is maintained on a MongoDB database to which this project provides a CRUD interface using REST web services.

**API:**

URL Format: `{service-url}/api/{version}/{resource}`, e.g., : `https://rikitrakiws-rikitraki.rhcloud.com/api/v1/tracks/'`

All results in JSON format except images and GPX files.

SSL is required on all authenticated/authorized calls.

**Resources**

|Resource|Verb|Description|Status Codes|
|---|---|---|---|
|`/token`|GET|Retrieves a new JWT token for API calls that require authorization. Requires basic authentication (userid/password)|200:&nbsp;Success<br>401:&nbsp;Unauthorized
|`/resettoken/?email={emai}&rturl={url}`|GET|Requests a JWT token to be used for password reset. Parameter email is the address of the user to which the token will be sent. Parameter rturl is the url of the password reset page which is emailed as a link.|200:&nbsp;Success<br>404:&nbsp;User&nbsp;not&nbsp;found
|`/users`|POST|Registers a new user. Requires a valid inviation code associated with a submitted email address. Returns username (same as submitted)|201:&nbsp;Success<br>400:&nbsp;Invalid input<br>401:&nbsp;Unauthorized<br>404:&nbsp;Missing&nbsp;invitation&nbsp;code<br>422:&nbsp;Duplicate<br>507:&nbsp;Database&nbsp;error
|`/users/me`|GET|Retrieves user profile information for the user in the embedded JWT token. Requires a valid JWT token in the header (Authorization: JWT {token})|200:&nbsp;Success<br>401:&nbsp;Unauthorized<br>404:&nbsp;User&nbsp;not&nbsp;found
|`/users/me`|PUT|Updates user profile information. Requires a valid JWT token in the header (Authorization: JWT {token})|204:&nbsp;Success<br>400:&nbsp;Invalid&nbsp;input<br>401:&nbsp;Unauthorized<br>404:&nbsp;User&nbsp;not&nbsp;found<br>422:&nbsp;Duplicate&nbsp;email&nbsp;address<br>507:&nbsp;Database&nbsp;error
|`/users/{username}`|PUT|Updates user password. Requires a valid JWT reset token in the header (Authorization: JWT {token})|204:&nbsp;Success<br>400:&nbsp;Invalid&nbsp;input<br>401:&nbsp;Unauthorized<br>507:&nbsp;Database&nbsp;error
|`/invitation`|POST|Requests an invitation to be emailed to the address submitted in the body.|204:&nbsp;Success<br>400:&nbsp;Invalid&nbsp;input<br>429:&nbsp;Invitation&nbsp;count&nbsp;exceeded
|`/tracks/`|GET|Returns a list of tracks.|200:&nbsp;Success<br>404:&nbsp;Not found
|`/tracks/?latlng={lat},{long}&distance={d}`|GET|Returns a list of tracks near a given location by a given distance in meters.|200:&nbsp;Success<br>404:&nbsp;Not found
|`/tracks/?small=yes`|GET|Returns abbreviated version of track list. Can be combined with geospatial search above.|200:&nbsp;Success<br>404:&nbsp;Not found
|`/tracks/`|POST|Creates a new track. JSON document in body. Requires a valid JWT token in the header (Authorization: JWT {token}). Returns trackId.|201:&nbsp;Success<br>400:&nbsp;Invalid input<br>401:&nbsp;Unauthorized<br>507:&nbsp;Database&nbsp;error
|`/tracks/{trackId}`|PUT|Updates track info. JSON document in body. Requires a valid JWT token in the header (Authorization: JWT {token}). Returns trackId.|200:&nbsp;Success<br>400:&nbsp;Invalid input<br>401:&nbsp;Unauthorized<br>403:&nbsp;Forbidden<br>507:&nbsp;Database&nbsp;error
|`/tracks/{trackId}`|DELETE|Deletes track and associated images. Requires a valid JWT token in the header (Authorization: JWT {token}).|204:&nbsp;Success<br>401:&nbsp;Unauthorized<br>403:&nbsp;Forbidden<br>507:&nbsp;Database&nbsp;error
|`/tracks/{trackId}`|GET|Returns a single track.|200:&nbsp;Success<br>404:&nbsp;Not found
|`/tracks/{trackId}/geotags`|GET|Returns the list of photo geotags for a given track.|200:&nbsp;Success<br>404:&nbsp;Not found
|`/tracks/{trackId}/GPX`|GET|Returns the GPX file associated with a given track in application/gpx+xml format.|200:&nbsp;Success<br>404:&nbsp;Not found
|`/tracks/{trackId}/thumbnail/{picIndex}`|GET|Returns a thumbnail picture for index picIndex in image/jpeg format.|200:&nbsp;Success<br>404:&nbsp;Not found
|`/tracks/{trackId}/picture/{picIndex}`|GET|Returns a picture for index picIndex in image/jpeg format.|200:&nbsp;Success<br>404:&nbsp;Not found
|`/tracks/{trackId}/picture/{picIndex}`|POST|Uploads a picture for index picIndex in image/jpeg format.|201:&nbsp;Success<br>404:&nbsp;Not found<br>507:&nbsp;Database error







**NOTE: RikiTrakiWS is under development**
