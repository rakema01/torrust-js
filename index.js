const https = require("https");
const fs = require("fs");

const parseJSON = (res) => {
    return new Promise((resolve, reject) => {
        let data = "";
        
        res
            .on("data", d => {
                data += d;
            })
            .on("end", () => {
                const result = JSON.parse(data).data;
                resolve(result);
            })
    })
}
const errors = {
    403: "Invalid login credentials",
    404: "Page not found",
    502: "Bad Gateway"
}
class Torrust {
    constructor(username="", password="", hostname="dl.rpdl.net", port=443){
        this.token = null;
        this.username = username;
        this.password = password;
        this.hostname = hostname;
        this.port = port;
        this.errorcodes = errors
    }
    getHTTPOptions(path="/", headers={}, method="GET") {
        const {hostname, port} = this;
        return {
            hostname,
            port,
            path,
            method,
            headers
        }
    }
    get(path) {
        return new Promise((resolve, reject) => {
            try{
                const tokenValidated = typeof this.token == "string" && this.token.split(".").length >= 3 ? this.token : "";
                https.get(this.getHTTPOptions(path, {"Authorization": `Bearer ${tokenValidated}`}), res => {
                    if(res.statusCode != 200){
                        const code = res.statusCode;
                        reject(this.errorcodes[code] || code);
                        return;
                    }
                    resolve(res);
                })
            } catch (e) {
                reject(e)
            }
    
        })
    }
    login(){
        return new Promise((resolve, reject) => {
            const loginString = JSON.stringify({login: this.username, password: this.password});
            const req = https.request(this.getHTTPOptions(
                "/api/user/login",
                {'Content-Type': "application/json",'Content-Length': loginString.length},
                "POST"
            ), res => {
                const errors = {
                    403: "Invalid login credentials",
                    404: "Page not found",
                    502: "Bad Gateway"
                }
                if(res.statusCode != 200){
                    const code = res.statusCode;
                    reject(this.errorcodes[code] || code);
                    return;
                }
                parseJSON(res)
                    .then(data => {
                        this.token = data.token;
                        resolve();
                    })
            })
        
            req.on("error", err => {
                reject(err);
            });
            req.write(loginString);
            req.end();
        });
    }
    getTorrent(id){
        return new Promise((resolve, reject) => {
            this.get(`/api/torrent/${id}`, this.token)
                .then((res) => {
                    parseJSON(res)
                        .then(resolve)
                }, reject)
        })
    }
    downloadTorrentFile(id, path){
        return new Promise((resolve, reject) => {
            if(fs.existsSync(`${path}/${id}.torrent`) || fs.existsSync(`${path}/${id}.torrent.downloading`)){
                reject("Torrent already exists or is already downloading.");
                return;
            }
            this.get(`/api/torrent/download/${id}`, this.token)
                .then((res) => {
                    const file = fs.createWriteStream(`${path}/${id}.torrent.downloading`);
                    res.pipe(file);
                    res.on('end', () => {
                        console.log(`${id} finished downloading!`);
                        setTimeout(() => {
                            fs.renameSync(`${path}/${id}.torrent.downloading`, `${path}/${id}.torrent`);
                            resolve(id);
                        }, 500);
                    })
                    res.on("error", () => {
                        reject(`Error occured while downloading file.`)
                    })
                }, reject)
        })
    }
    getTorrents(page_size){
        return new Promise((resolve, reject) => {
            this.get(`/api/torrents?page_size=${page_size}`)
                .then((res) => {
                    parseJSON(res)
                        .then(resolve)
                }, reject)
        })

    }
    verifyToken(){
        return new Promise((resolve, reject) => {
            this.getTorrents()
                .then(torrents => {
                    this.getTorrent(torrents.results[0].torrent_id)
                        .then(torrent => {
                            resolve(torrent.trackers[0].split("/announce").pop() != "/")
                        }, reject)
                }, reject)
        })
    }
}

module.exports = Torrust;