"use strict";

const avro = require('avsc');
const util = require('util');

/**
 * Implementation of custom logical type as outlined in
 * https://github.com/mtth/avsc/wiki/Advanced-usage#logical-types
 * Some hints from here as well
 * https://github.com/mtth/avsc/issues/119
 */
function KeyRulerString(attrs, opts) {
    avro.types.LogicalType.call(this, attrs, opts);

    this._context = attrs.context;
    this._isPII = attrs.isPII;
}

util.inherits(KeyRulerString, avro.types.LogicalType);

KeyRulerString.prototype._fromValue = function (buf) {
    console.log("_from " + this._context + " " + buf);

    return buf;
};

KeyRulerString.prototype._toValue = function (buf) {
    console.log("_to " + this._context + " " + buf);

    return buf;
};

var KafkaAvro = require('kafka-avro');

var kafkaAvro = new KafkaAvro({
    kafkaBroker: 'localhost:9092',
    schemaRegistry: 'http://localhost:8081',
    parseOptions: {wrapUnions: false, logicalTypes: {'keyruler-string': KeyRulerString}}
});
