FROM ubuntu:18.04

# 安装依赖 参见：https://github.com/Automattic/node-canvas
RUN apt-get update && \
    apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# 安装node
RUN set -x \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash - \
    && apt-get install -y \
        nodejs \
    && npm install -g npm@latest yarn@latest

# font 可以不安装
RUN apt-get install -y \
    fonts-noto-cjk fonts-noto-hinted fonts-noto-unhinted fonts-hanazono ttf-unifont

# 输出版本
RUN node -v
RUN npm -v
RUN yarn -v

# 清空缓存
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* /var/tmp/*

# 创建工作目录，对应的是应用代码存放在容器内的路径
WORKDIR /app

COPY package.json *.lock ./

# 只安装dependencies依赖
# node镜像自带yarn
RUN yarn --registry=https://registry.npm.taobao.org

# 把其他源文件复制到工作目录
COPY . .

# 替换成应用实际的端口号
#EXPOSE ${app_port}

#ARG HOST=${HOST}
#ARG PORT=${PORT}
#ARG PROXYSERVICE=${PROXYSERVICE}
# Environment variables
#ENV HOST ${APP_HOST}
#ENV PORT ${APP_PORT}
#ENV PROXYSERVICE ${PROXYSERVICE}

#EXPOSE 7001

# 添加源代码
ADD . /app

# 运行app.js
CMD ["npm", "start"]
