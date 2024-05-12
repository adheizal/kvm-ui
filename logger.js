const { Logtail } = require("@logtail/node");
const config = require('./config.js');
const logtail = new Logtail(config.LOGTAIL_TOKEN);