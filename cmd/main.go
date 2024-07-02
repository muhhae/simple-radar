package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	conn *websocket.Conn
}

var (
	clients    = make(map[*Client]bool)
	broadcast  = make(chan string)
	distance   = make(map[int]int)
	currentDeg = 0
)

func main() {
	e := echo.New()
	defer e.Close()

	e.Static("/radar", "static")

	e.GET("/ws", handleConnection)
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello World")
	})
	e.GET("/distance", func(c echo.Context) error {
		deg, _ := strconv.Atoi(c.QueryParam("dist"))
		return c.String(http.StatusOK, strconv.Itoa(distance[deg]))
	})

	e.GET("current-deg", func(c echo.Context) error {
		return c.String(http.StatusOK, strconv.Itoa(currentDeg))
	})
	log.Println("Server started on :8080")
	e.Logger.Fatal(e.Start(":8080"))
}

func decodeMessage(message string) (int, int, error) {
	parts := strings.Split(message, ":")
	if len(parts) != 2 {
		return 0, 0, fmt.Errorf("invalid message format")
	}

	degree, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid degree value: %v", err)
	}

	distance, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, 0, fmt.Errorf("invalid distance value: %v", err)
	}

	return degree, distance, nil
}

func handleConnection(c echo.Context) error {
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	defer ws.Close()

	client := &Client{conn: ws}
	clients[client] = true

	for {
		_, message, err := ws.ReadMessage()
		if err != nil {
			log.Println(err)
			delete(clients, client)
			break
		}
		log.Printf("Received: %s\n", message)
		deg, dist, _ := decodeMessage(string(message))
		distance[deg] = dist
	}
	return nil
}
