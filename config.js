'use strict'
var path = require('path');
var util = require('./libs/util');
var wechat_file = path.join(__dirname, './config/wechat.txt');
var wechat_ticket_file = path.join(__dirname, './config/wechat_ticket.txt');

var config = {
  wechatOpts: {
    appID:'wx76d958a0b9c33967',
    appSecret:'698f02db722c22f8e9b7a63ed6779e5d',
    token:'mrnull',
    getAccessToken: function() {
      return util.readFileAsync(wechat_file);
    },
    saveAccessToken: function(data) {
      data = JSON.stringify(data);
      return util.writeFileAsync(wechat_file, data);
    },
    getTicket: function() {
      return util.readFileAsync(wechat_ticket_file);
    },
    saveTicket: function(data) {
      data = JSON.stringify(data);
      return util.writeFileAsync(wechat_ticket_file, data);
    }
  }
}

module.exports = config;
