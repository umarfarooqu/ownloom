    # Stage 1: Build the React app
    FROM node:18 AS build

    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npm run build

    # Stage 2: Serve the app with the Nginx web server
    FROM nginx:stable-alpine
    # Copy the finished build from Stage 1
    COPY --from=build /app/dist /usr/share/nginx/html
    # Copy our custom Nginx configuration
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    # Tell Docker that the container will be accessible on port 80
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    
