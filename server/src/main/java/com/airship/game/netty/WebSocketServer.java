package com.airship.game.netty;

import io.netty.bootstrap.ServerBootstrap;
import io.netty.channel.ChannelFuture;
import io.netty.channel.ChannelOption;
import io.netty.channel.EventLoopGroup;
import io.netty.channel.nio.NioEventLoopGroup;
import io.netty.channel.socket.nio.NioServerSocketChannel;

public class WebSocketServer {

    private int port;
    private EventLoopGroup bossGroup;
    private EventLoopGroup workerGroup;

    public WebSocketServer(int port) {
        this.port = port;
    }

    public void start() throws InterruptedException {
        bossGroup = new NioEventLoopGroup(1);
        workerGroup = new NioEventLoopGroup();

        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class)
             .option(ChannelOption.SO_BACKLOG, 100)
             .option(ChannelOption.SO_KEEPALIVE, true)
             .childHandler(new WebSocketServerInitializer())
             .childOption(ChannelOption.TCP_NODELAY, true)
             .childOption(ChannelOption.SO_SNDBUF, 1024 * 1024)
             .childOption(ChannelOption.SO_RCVBUF, 1024 * 1024);

            ChannelFuture f = b.bind(port).sync();
            System.out.println("[WebSocketServer] Started on port " + port);
            System.out.println("[WebSocketServer] WebSocket endpoint: ws://localhost:" + port + "/ws");
            
            f.channel().closeFuture().sync();
        } finally {
            stop();
        }
    }

    public void stop() {
        if (bossGroup != null) {
            bossGroup.shutdownGracefully();
        }
        if (workerGroup != null) {
            workerGroup.shutdownGracefully();
        }
        System.out.println("[WebSocketServer] Stopped");
    }
}
