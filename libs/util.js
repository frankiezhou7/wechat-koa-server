'use strict'

var fs = require('fs');
var Promise = require('bluebird');

exports.readFileAsync = function(fpath, encoding) {
  return new Promise(function(res, rej){
    fs.readFile(fpath, encoding, function(err, content) {
      if(err) rej(err)
      else res(content)
    })
  })
}

exports.writeFileAsync = function(fpath, encoding) {
  return new Promise(function(res, rej){
    fs.writeFile(fpath, encoding, function(err) {
      if(err) rej(err)
      else res()
    })
  })
}
