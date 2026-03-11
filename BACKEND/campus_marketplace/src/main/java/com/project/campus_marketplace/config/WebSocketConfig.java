package com.project.campus_marketplace.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // This is the prefix for messages sent FROM the server TO the client
        config.enableSimpleBroker("/user");
        // This is the prefix for messages sent FROM the client TO the server
        config.setApplicationDestinationPrefixes("/app");
        // Required to route messages to specific users privately
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // This is the initial endpoint the React app will hit to establish the connection
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allows cross-origin requests from React
                .withSockJS(); // Fallback for browsers that don't support WebSockets
    }
}