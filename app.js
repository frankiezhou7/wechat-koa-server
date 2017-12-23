'use strict'
// https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx76d958a0b9c33967&secret=698f02db722c22f8e9b7a63ed6779e5d
var koa = require('koa');
var middleware = require('./component/middleware.js');
var config = require('./config');
var reply = require('./reply');
var ejs = require('ejs');
var heredoc = require('heredoc');
var crypto = require('crypto');
var Wechat = require('./component/wechat');

var wechatApi = new Wechat(config.wechatOpts);
var app = new koa();
var tpl = heredoc(function() {/*
<!DOCTYPE html>
<html>
  <head>
    <title>猜电影</title>
    <meta name="viewport" content="initial-scale=1", maximum-scale=1, minimum-scale=1"/>
  </head>
  <body>
    <h1>点击标题，开始录音翻译</h1>
    <p id="title"></p>
    <div id="poster"></div>
    <script scr="http://zeptojs.com/zepto-docs.min.js"></script>
    <script scr="http://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
    <script>
      wx.config({
        debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
        appId: 'wx76d958a0b9c33967', // 必填，公众号的唯一标识
        timestamp: <%= timestamp %>, // 必填，生成签名的时间戳
        nonceStr: <%= noncestr %>, // 必填，生成签名的随机串
        signature: <%= signature %>,// 必填，签名，见附录1
        jsApiList: [
          'startRecord',
          'stopRecord',
          'onVoiceRecordEnd',
          'translateVoice'
      ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
      });
    </script>
  </body>
</html>
*/})

var createNonce = function() {
  return Math.random().toString(36).substr(2, 15)
};

var createTimestamp = function() {
  return parseInt(new Date().getTime() / 1000, 10) + ''
};

var _sign = function(noncestr, ticket, timestamp, url) {
  var params = [
    'noncestr=' + noncestr,
    'jsapi_ticket=' + ticket,
    'timestamp=' + timestamp,
    'url=' + url
  ];
  var str = params.sort().join('&');
  var shasum = crypto.createHash('sha1');
  shasum.update(str);
  return shasum.digest('hex');
};

function sign(ticket, url){
  var noncestr= createNonce();
  var timestamp = createTimestamp();
  var signature = _sign(noncestr, ticket, timestamp, url);

  return {
    noncestr,
    timestamp,
    signature
  }
};

app.use(function *(next){
  if(this.url.indexOf('/movie') > -1){
    var data = yield wechatApi.fetchAccessToken();
    var access_token = data.access_token;
    // var ticketData = yield wechatApi.fetchTicket(access_token);
    console.log(data)
    // var ticket = ticketData.ticket;
    // var url = this.href;
    // var params = sign(ticket,url);
    // console.log(params);
    // this.body = ejs.render(tpl, params);
    return next;
  }
  yield next;
});

app.use(middleware(config.wechatOpts, reply.reply));

app.listen(80);
console.log('listening:80');
