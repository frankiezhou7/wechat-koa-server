'use strict'

var util = require('./util')
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var fs = require('fs');
var _ = require('lodash');
var prefix = 'https://api.weixin.qq.com/cgi-bin/';
var semanticUrl = 'https://api.weixin.qq.com/semantic/search?';
var api = {
  accessToken: prefix + 'token?grant_type=client_credential',
  temporary: {
    upload: prefix + 'media/upload?',
  },
  permanent: {
    upload: prefix + 'material/add_material?',
    uploadNews: prefix + 'material/add_news?',
    uploadNewsPic: prefix + 'media/uploadimg?'
  },
  group: {
    create: prefix + '/groups/create?',
    fetch: prefix + '/groups/get?',
    check: prefix + '/groups/getid?',
    update: prefix + '/groups/update?',
    move: prefix + '/groups/members/update?',
    batchupdate: prefix + '/groups/members/batchupdate?',
    del: prefix + '/groups/delete?',
  },
  user: {
    remark: prefix + 'user/info/updateremark?',
    fetch: prefix + 'user/info?',
    batchFetch: prefix + 'user/info/batchget?',
    list: prefix + 'user/get?',
  },
  mass: {
    group: prefix + 'message/mass/sendall?',
    openId: prefix + 'message/mass/send?',
    del: prefix + 'message/mass/delete?',
    preview: prefix + 'message/mass/preview?',
    check: prefix + 'message/mass/get?',
  },
  menu: {
    create: prefix + 'menu/create?',
    get: prefix + 'menu/get?',
    del: prefix + 'menu/delete?',
    current: prefix + 'get_current_selfmenu_info?',
  },
  ticket: {
    get: prefix + 'ticket/getticket?',
  }
}

function Wechat(opts, handler) {
    var that = this;
    this.appID = opts.appID;
    this.appSecret = opts.appSecret;
    this.getAccessToken = opts.getAccessToken;
    this.saveAccessToken = opts.saveAccessToken;
    this.getTicket = opts.getTicket;
    this.saveTicket = opts.saveTicket;

    this.fetchAccessToken();

}

Wechat.prototype.fetchTicket = function(accessToken) {
  var that = this;

  this.getTicket().then(function(data) {
    try {
      data = JSON.parse(data);
    }
    catch (e) {
      return that.updateTicket(accessToken);
    }
    if (that.isValidTicket(data)) {
      return Promise.resolve(data);
    } else {
      return that.updateTicket();
    }
  }).then(function(data){
    that.saveTicket(data);
    return Promise.resolve(data);
  });
}

Wechat.prototype.updateTicket = function(accessToken) {
  var url = api.ticket.get + '&access_token=' + accessToken + '&type=jsapi';

  return new Promise(function(res, rej) {
    request({url: url, json: true}).then(function(response) {
      var data = response.body;
      var now = new Date().getTime();
      var expires_in = now + (data.expires_in - 20) * 1000;

      data.expires_in = expires_in;
      res(data);
    })
  })
}

Wechat.prototype.isValidTicket = function(data) {
  if (!data || !data.ticket || !data.expires_in) {
    return false;
  }

  var ticket = data.ticket;
  var expires_in = data.expires_in;
  var now = new Date().getTime();

  if (ticket && now < expires_in) {
    return true;
  } else {
    return false;
  }
}

Wechat.prototype.fetchAccessToken = function(data) {
  var that = this;

  if(this.access_token && this.expires_in) {
    if(this.isValidAccessToken(this)) {
      return Promise.resolve(this);
    }
  }

  this.getAccessToken().then(function(data) {
    try {
      data = JSON.parse(data);
    }
    catch (e) {
      return that.updateAccessToken(data);
    }
    if (that.isValidAccessToken(data)) {
      return Promise.resolve(data);
    } else {
      return that.updateAccessToken();
    }
  }).then(function(data){
    that.access_token = data.access_token;
    that.expires_in = data.expires_in;
    that.saveAccessToken(data);

    return Promise.resolve(data);
  })
}

Wechat.prototype.isValidAccessToken = function(data) {
  if (!data || !data.access_token || !data.expires_in) {
    return false;
  }

  var access_token = data.access_token;
  var expires_in = data.expires_in;
  var now = new Date().getTime();

  if (now < expires_in) {
    return true;
  } else {
    return false;
  }
}

Wechat.prototype.updateAccessToken = function() {
  var appID = this.appID;
  var appSecret = this.appSecret;
  var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret;

  return new Promise(function(res, rej) {
    request({url: url, json: true}).then(function(response) {
      var data = response.body;
      var now = new Date().getTime();
      var expires_in = now + (data.expires_in - 20) * 1000;

      data.expires_in = expires_in;
      res(data);
    })
  })
}

Wechat.prototype.semantic = function(sematicData) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = semanticUrl + 'access_token=' + data.access_token;
      sematicData.appid = data.appID;

      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: sematicData
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('Sematic fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.createGroup = function(name) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.group.create + 'access_token=' + data.access_token;

      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: {
          group: {
            name: name
          }
        }
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('create Group fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.fetchGroups = function(name) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.group.fetch + 'access_token=' + data.access_token;

      var options = {
        url: url,
        json: true
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('fetch Group fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.checkGroup = function(openId) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.group.fetch + 'access_token=' + data.access_token;

      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: {
          openid: openId
        }
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('check Group fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.updateGroup = function(id, name) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.group.update + 'access_token=' + data.access_token;

      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: {
          group: {
            id,
            name
          }
        }
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('update Group fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}


Wechat.prototype.moveGroup = function(openIds, to) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url, options;
      if(_.isArray(openIds)) {
        url = api.group.batchupdate + 'access_token=' + data.access_token;
        options = {
          method: 'POST',
          url: url,
          json: true,
          body: {
            group: {
              openid_list: openIds,
              to_groupid: to
            }
          }
        };
      } else {
        url = api.group.move + 'access_token=' + data.access_token;
        options = {
          method: 'POST',
          url: url,
          json: true,
          body: {
            group: {
              openId: openIds,
              to_groupid: to
            }
          }
        };
      }

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('move Group fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.deleteGroup = function(id) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.group.del + 'access_token=' + data.access_token;

      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: {
          group: {
            id
          }
        }
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('delete Group fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.listUsers = function(openId) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.user.list + 'access_token=' + data.access_token;

      if(openId) {
        url += '&next_openid' + openId;
      }

      var options = {
        method: 'GET',
        url: url,
        json: true,
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('list user fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.createMenu = function(menu) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.menu.create + 'access_token=' + data.access_token;
      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: menu,
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('create menu fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.getMenu = function() {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.menu.get + 'access_token=' + data.access_token;
      var options = {
        url: url,
        json: true,
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('get menu fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.deleteMenu = function() {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.menu.del + 'access_token=' + data.access_token;
      var options = {
        url: url,
        json: true,
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('delete menu fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.checkMass = function(msgId) {
  var that = this;
  var form = {
    msg_id: msgId,
  }

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.mass.check + 'access_token=' + data.access_token;
      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: form,
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('preview message fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.previewMass = function(type, message, openId) {
  var that = this;
  var msg = {
    msgtype: type,
    touser: openId,
  }

  msg[type] = message;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.mass.preview + 'access_token=' + data.access_token;
      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: msg,
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('send to openid user fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.deleteMass = function(msgId) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.mass.del + 'access_token=' + data.access_token;
      var form = {
        msg_id: msgId
      };
      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: form,
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('send to openid user fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.sendByOpenId = function(type, message, openIds) {
  var that = this;
  var msg = {
    msgtype: type,
    touser: openIds
  }

  msg[type] = message;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.mass.openId + 'access_token=' + data.access_token;

      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: msg,
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('send to openid user fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.sendByGroup = function(type, message, groupId) {
  var that = this;
  var msg = {
    filter: {},
    msgtype: type
  }

  msg[type] = message;

  if(!groupId) {
    msg.filter.is_to_all = true;
  } else {
    msg.filter = {
      is_to_all: false,
      group_id: groupId

    }
  }

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.mass.group + 'access_token=' + data.access_token;

      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: msg,
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('send to group user fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.remarkUser = function(openId, remark) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = api.user.remark + 'access_token=' + data.access_token;

      var options = {
        method: 'POST',
        url: url,
        json: true,
        body: {
          openid: openId,
          remark: remark,
        }
      };

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('remark user fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.fetchUsers = function(openIds, lang) {
  var that = this;

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      lang = lang || 'zh-CN';
      var options = {
        json:true
      };

      if(_.isArray(openIds)) {
        options.url = api.user.batchFetch + 'access_token=' + data.access_token;
        options.form = {
          user_list: openIds
        };
        options.method = 'POST';
      } else {
        options.url = api.user.fetch + 'access_token=' + data.access_token + '&openid=' + openIds + '&lang=' + lang;
      }


      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('fetch user fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.uploadMaterial = function(type, material, permanent) {
  var that = this;
  var form = {};
  var uploadUrl = api.temporary.upload;

  if(permanent) {
    uploadUrl = api.permanent.upload;
    _.extend(form, permanent);
  }

  if(type === 'pic') {
    uploadUrl = api.permanent.uploadNewsPic;
  }

  if(type === 'news') {
    uploadUrl = api.permanent.uploadNews;
    form = material;
  } else {
    form.media = fs.createReadStream(material);
  }

  return new Promise(function(res, rej) {
    that.fetchAccessToken()
    .then(function(data) {
      var url = uploadUrl + 'access_token=' + data.access_token;
      if(!permanent) {
        url += '&type=' + type;
      } else {
        form.access_token = data.access_token;
        url += '&type=' + type;
      }

      var options = {
        method: 'POST',
        url: url,
        json: true
      };

      if(type === 'news') {
        options.body = form;
      } else {
        options.formData = form;
      }

      request(options).then(function(response) {
        var _data = response.body;

        if(_data) {
          res(_data);
        } else {
          throw new Error('Upload material fails');
        }
      })
    })
    .catch(function(err) {
      rej(err);
    })
  })
}

Wechat.prototype.reply = function() {
  var content = this.body;
  var message = this.weixin;

  var xml = util.template(content, message);
  console.log(xml)

  this.status = 200;
  this.type = 'application/xml';
  this.body = xml;
}

module.exports = Wechat;
