var http=require('http')
http.createServer().listen(7000)
function server(req,res){
    res.write('ABCD')
    req.end()

}
