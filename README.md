# Remote terminal

This is a node server that uses websockets implemented via socket.io to
pass input and output from a terminal session.
This is intended to be run using Docker.

# Customize

Place your files under "files" folder. You can edit the README there.
Then build the image:

```
docker build -t remote-terminal .
```

Run it

```
docker run --rm -d -p 8090:3000 remote-terminal
``` 

Now visit localhost:8090 !
