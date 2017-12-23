'use strict'

var config = require('./config');
var Wechat = require('./component/wechat');
var path = require('path');

var wechatApi = new Wechat(config.wechatOpts);

exports.reply = function* (next) {
  var message = this.weixin;

  if(message.MsgType === 'event'){
    if(message.Event === 'subscribe') {
      if(message.EventKey) {
        console.log('扫描二维码进来：' + message.EventKey + ' ' + message.ticket)
      }
      this.body = '哈哈， 你订阅了这个号\r\n' + ' 消息ID: ' + (message.MsgId || '0');
    } else if(message.Event === 'unsubscribe') {
      console.log('无情取关！')
      this.body = '无情取关！';
    } else if (message.Event === 'LOCATION') {
      this.body = '您上报的位置是: ' + message.Latitude + '/' + message.Longitude + '-' + message.Precision;
    } else if (message.Event === 'CLICK') {
      this.body = '您点击了菜单' + message.EventKey;
    } else if (message.Event === 'SCAN') {
      console.log('关注后扫二维码' + message.EventKey + ' ' + message.Ticket);
      this.body = '看到你扫一下咯'
    } else if (message.Event === 'VIEW') {
      this.body = '你点击了菜单中的链接： ' + message.EventKey;
    }
  } else if (message.MsgType === 'text') {
      var content = message.Content;
      var reply = '额，你说的:' + content + '太复杂了';

      if(content === '1') {
        reply = '天下第一';
      } else if (content === '文章') {
        reply = [{
          title: '技术改变世界',
          description: '描述一枚',
          picUrl: 'http://www.runoob.com/wp-content/uploads/2014/03/nodejs.jpg'
        },{
          title: 'node.js开发微信',
          description: '描述两枚',
          picUrl: 'http://www.runoob.com/wp-content/uploads/2013/10/bs.png'
        }];
      } else if (content === '图片') {
        var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpeg');
        /* console.log(data);
                { type: 'image',
                  media_id: 'd-fxoQMalS6JAwKOIQ9kxlDbO4Ic02YoWXLrf0FsqHD3NW_Sco4rbUFEpb336mi5',
                  created_at: 1507213501 }*/
        reply = {
          type: 'image',
          mediaId: data.media_id
        }
      } else if (content === '视频') {
        var data = yield wechatApi.uploadMaterial('video', __dirname + '/2.mp4');
        reply = {
          type: 'video',
          title: '回复视频内容',
          description: '小鸭戏水',
          mediaId: data.media_id
        }
      } else if (content === '音乐') {
        var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpeg');
        reply = {
          type: 'music',
          title: '回复音乐内容',
          description: '放松一下',
          musicUrl: 'http://ting666.yymp3.net:81/new1_hy/01_ng/abao2/1.mp3',
          thumbMediaId: data.media_id
        }
      } else if (content === '8') {
        var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpeg', {type: 'image'});
        reply = {
          type: 'image',
          mediaId: data.media_id
        }
      } else if (content === '9') {
        var data = yield wechatApi.uploadMaterial('video', __dirname + '/2.mp4',
        {type: 'video', description: '{"title": "Really a nice place", "introduction: "Never think it is so easy"}'});
        reply = {
          type: 'video',
          title: '回复视频内容2',
          description: '小鸭戏水2',
          mediaId: data.media_id
        }
      } else if (content === '12') {
        var group = yield wechatApi.createGroup('wechat')
        console.log('新分组', group);

        var groups = yield wechatApi.fetchGroups()
        console.log('分组列表', groups);

        var group2 = yield wechatApi.checkGroup(message.FromUserName);
        console.log('分组所在', group2);

        var result = yield wechatApi.moveGroup(message.FromUserName, 118);
        console.log('移动到118', result);

        var result2 = yield wechatApi.moveGroup([message.FromUserName], 116);
        console.log('批量移动到116', result2);

        var result3 = yield wechatApi.updateGroup(118, 'wechat 118');
        console.log('118改名', result3);

        var result4 = yield wechatApi.deleteGroup(114);
        console.log('114删除', result4);

        reply = 'group done';
      } else if (content === '13') {
        var user = yield wechatApi.fetchUsers(message.FromUserName, 'en');
        console.log(user);
        var openIds = [{
          openid: message.FromUserName,
          lang: 'en'
        }];
        var users = yield wechatApi.fetchUsers(openIds);
        console.log(users);
        reply = JSON.stringify(user);
      } else if (content === '14') {
        var userlist = yield wechatApi.listUsers();
        console.log(userlist);
        reply = userlist.total;
      } else if (content === '15') {
        var mpnews = {
          media_id: 'IdH1I7dmY3N1cesP_C5emTr9x9rYfImcHOrvLQ6RXBns29NSL8CoGkX6lHd5PKC'
        }
        var msgData = yield wechatApi.sendByGroup('mpnews', mpnews);
        console.log(msgData);
        reply = 'yeah!';
      } else if (content === '16') {
        var mpnews = {
          media_id: 'IdH1I7dmY3N1cesP_C5emTr9x9rYfImcHOrvLQ6RXBns29NSL8CoGkX6lHd5PKC'
        }
        var text = {
          'content': 'hello wechat'
        };

        var msgData = yield wechatApi.previewMass('text', text);
        console.log(msgData);
        reply = 'yeah!';
      } else if (content === '17') {
        var msgData = yield wechatApi.checkMass('4009530');
        console.log(msgData);
        reply = 'yeah!';
      } else if (content === '20') {
        var semanticData = {
          'query': '寻龙诀',
          'city' : '北京',
          'category': 'movie',
          'uid': message.FromUserName
        };
        var data = yield wechatApi.semantic(semanticData);
        console.log(data);
        reply = JSON.stringify(data);
      }

      this.body = reply;
  }
}
