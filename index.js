const https = require("https");

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

class Torrust {
    constructor(hostname="dl.rpdl.net", port=443, username="", password=""){
        this.token = null;
        this.username = username;
        this.password = password;
        this.hostname = hostname;
        this.port = port;
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
                https.get(this.getHTTPOptions(path, {"Authorization": `Bearer ${typeof token == "String" && this.token.split(".").length == 3 ? this.token : ""}`}), res => {
                    if(res.statusCode >= 400){
                        reject(`Failed to GET ${path}: ${res.statusCode}`);
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
                    reject(errors[code] || code);
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
    downloadTorrent(id){
        return new Promise((resolve, reject) => {
            this.get(`/api/torrent/download/${id}`, this.token)
                .then(resolve, reject)
        })
    }
    getTorrents(){
        return new Promise((resolve, reject) => {
            this.get(`/api/torrents`)
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