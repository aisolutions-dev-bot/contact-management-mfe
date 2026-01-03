# Stage 1: Build Angular app
FROM node:20-alpine AS build

RUN npm install -g pnpm
WORKDIR /app

# Copy manifests first for better caching
COPY pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of the source code
COPY . .

ARG GIT_BRANCH=$GIT_BRANCH

# Build Angular app for or staging accordingly
RUN if [ "$GIT_BRANCH" = "staging" ]; then \
    pnpm build --configuration staging; \
    else \
    pnpm build --configuration production; \
    fi

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular dist output
COPY --from=build /app/dist/contact-management-mfe /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
