# Gunakan Node.js versi 22 
FROM node:22-alpine

# Tentukan direktori kerja di root container
WORKDIR /usr/src/app

# Salin package.json dari root proyek
COPY package*.json ./

# Instal dependensi produksi
RUN npm install --production

# Salin seluruh file proyek
COPY . .

# Buka port 3000
EXPOSE 3000

# Eksekusi server Express yang ada di dalam folder backend
CMD ["node", "backend/server.js"]