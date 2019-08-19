(function (global, factory) {
    return factory.call(global, global.jQuery);
})(this, function (global, factory) {
    // 数据缓存
    var rbrace = /^(?:\{.*\}|\[.*\])$/, // 花括号或方括号
        rmultiDash = /([a-z])([A-Z])/g; // 驼峰写法，大小写之间会被插入破折号
    jQuery.extend({
        cache: {},
        // Please use with caution
        uuid: 0, // 唯一id种子，DOM元素第一次调用data接口存储数据时，会用uuid++的方式，生成一个新的唯一id
        // Unique for each copy of jQuery on the page
        // Non-digits removed to match rinlinejQuery
        // 页面上jQuery副本的唯一标识
        // 非数字符号被移除以匹配rinlinejQuery
        expando: "jQuery" + (jQuery.fn.jquery + Math.random()).replace(/\D/g, ""),
        // The following elements throw uncatchable exceptions if you
        // attempt to add expando properties to them.
        //
        // YunG:
        // 如果尝试在embed、object、applet上附加属性值，将会抛出未捕获的异常
        //
        // embed：
        // embed标签用于播放一个多媒体对象，包括Flash、音频、视频等
        // http://221.199.150.103/jsj/html/page/book/xhtml/m_embed.htm
        //
        // object：
        // object元素用于向页面添加多媒体对象，包括Flash、音频、视频等。它规定了对象的数据和参数，以及可用来显示和操作数据的代码。
        // <object>与</object>之间的文本是替换文本，如果用户的浏览器不支持此标签会显示这些文本。
        // object元素中一般会包含<param>标签，<param>标签可用来定义播放参数。
        // http://221.199.150.103/jsj/html/page/book/xhtml/m_object.htm?F=14,L=1
        //
        // <embed>和<object>标签的区别：两者都是用来播放多媒体文件的对象，object元素用于IE浏览器，embed元素用于非IE浏览器，为了保证兼容性，通常我们同时使用两个元素，浏览器会自动忽略它不支持的标签。同时使用两个元素时，应该把<embed>标签放在<object>标签的内部。
        //
        // applet：
        // 不赞成使用
        noData: {
            "embed": true,
            // Ban all objects except for Flash (which handle expandos)
            "object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
            "applet": true
        },
        // 判断一个元素是否有与之关联的数据（通过jQuery.data设置），用在事件处理中
        hasData: function (elem) {
            // 如果是DOM元素，则从jQuery.cache中读取，关联jQuery.cache和DOM元素的id存储在属性jQuery.expando中
            // 如果是非DOM元素，则直接从elem上取，数据存储在 jQuery.expando 属性中
            // elem的属性jQuery.expando，要么值是id，要么值是要存储的数据
            // elem被替换为所存储的数据
            elem = elem.nodeType ? jQuery.cache[elem[jQuery.expando]] : elem[jQuery.expando];
            return !!elem && !isEmptyDataObject(elem);
        },
        /**
         * jQuery.data( elem, key, value ) 在指定元素上存储/添加任意的数据，处理了循环引用和内存泄漏问题
         * jQuery.data( elem, key ) 返回指定元素上name指定的值
         * jQuery.data( elem ) 返回全部数据
         */
        /**
         * pvt 私有的，是否是内部使用的独立对象，pvt为true时用于事件处理
         */
        data: function (elem, name, data, pvt /* Internal Use Only */ ) {
            // 是否可以附加数据，不可以则直接返回
            if (!jQuery.acceptData(elem)) {
                return;
            }
            var internalKey = jQuery.expando, // 内部key？
                getByName = typeof name === "string", // name必须是字符串？
                thisCache,
                // We have to handle DOM nodes and JS objects differently because IE6-7
                // can't GC object references properly across the DOM-JS boundary
                // 必须区分处理DOM元素和JS对象，因为IE6-7不能垃圾回收对象跨DOM对象和JS对象进行的引用属性
                isNode = elem.nodeType,
                // Only DOM nodes need the global jQuery cache; JS object data is
                // attached directly to the object so GC can occur automatically
                // 如果是DOM元素，则使用全局的jQuery.cache（为什么？DOM元素不能存储非字符串？无法垃圾回收？）
                // 如果是JS对象，则直接附加到对象上
                cache = isNode ? jQuery.cache : elem,
                // Only defining an ID for JS objects if its cache already exists allows
                // the code to shortcut on the same path as a DOM node with no cache
                // 如果JS对象的cache已经存在，则需要为JS对象定义一个ID
                // 如果是DOM元素，则直接取elem[ jQuery.expando ]，返回id（有可能是undefined）
                // 如果是JS对象，且JS对象的属性jQuery.expando存在，返回jQuery.expando（有可能是 undefined）
                id = isNode ? elem[jQuery.expando] : elem[jQuery.expando] && jQuery.expando;
            // Avoid doing any more work than we need to when trying to get data on a
            // object that has no data at all
            // 避免做更多的不必要工作，当尝试在一个没有任何数据的对象上获取数据时
            // name是字符串，data未定义，说明是在取数据
            // 但是对象没有任何数据，直接返回
            // ？id不存在，说明没有数据；或者，id存在，但是属性internalKey不存在，也说明没有数据
            // ？internalKey到底是干什么用的？
            if ((!id || (pvt && id && !cache[id][internalKey])) &&
                getByName && data === undefined) {
                return;
            }
            // id不存在的话就生成一个
            if (!id) {
                // Only DOM nodes need a new unique ID for each element since their data
                // ends up in the global cache
                // 只有DOM元素需要一个唯一ID，因为DOM元素的数据是存储在全局cache中的。
                // 用uuid种子递增分配唯一ID
                if (isNode) {
                    elem[jQuery.expando] = id = ++jQuery.uuid;
                } else {
                    // JS对象则直接使用jQuery.expando，既然是直接附加到对象上，又何必要id呢？
                    // 避免与其他属性冲突！
                    id = jQuery.expando;
                }
            }
            // 数据存储在一个映射对象中({})
            if (!cache[id]) {
                cache[id] = {}; // 初始化存储对象
                // 这是什么东东？既然是一个“恶作剧”，那就就忽略它，不深究。
                // TODO: This is a hack for 1.5 ONLY. Avoids exposing jQuery
                // metadata on plain JS objects when the object is serialized using
                // JSON.stringify
                if (!isNode) {
                    cache[id].toJSON = jQuery.noop;
                }
            }
            // An object can be passed to jQuery.data instead of a key/value pair; this gets
            // shallow copied over onto the existing cache
            // data接口接收对象和函数，浅拷贝
            if (typeof name === "object" || typeof name === "function") {
                // 私有数据，存储在cache[ id ][ internalKey ]中
                // 什么类型的数据算私有数据呢？事件处理函数，还有么？
                if (pvt) {
                    cache[id][internalKey] = jQuery.extend(cache[id][internalKey], name);
                } else {
                    cache[id] = jQuery.extend(cache[id], name);
                }
            }
            // 存储对象，存放了所有数据的映射对象
            thisCache = cache[id];
            // Internal jQuery data is stored in a separate object inside the object's data
            // cache in order to avoid key collisions between internal data and user-defined
            // data
            // jQuery内部数据存在一个独立的对象（thisCache[ internalKey ]）上，为了避免内部数据和用户定义数据冲突
            //
            // 如果是私有数据
            if (pvt) {
                // 存放私有数据的对象不存在，则创建一个{}
                if (!thisCache[internalKey]) {
                    thisCache[internalKey] = {};
                }
                // 使用私有数据对象替换thisCache
                thisCache = thisCache[internalKey];
            }
            // 如果data不是undefined，表示传入了data参数，则存储data到name属性上
            // 这里为什么要统一为驼峰写法呢？
            // 这里的问题是：如果传入的是object/function，不做转换，只有传入的name是字符串才会转换。
            if (data !== undefined) {
                thisCache[jQuery.camelCase(name)] = data;
            }
            // 又是一个hack，忽略它，不研究
            // TODO: This is a hack for 1.5 ONLY. It will be removed in 1.6. Users should
            // not attempt to inspect the internal events object using jQuery.data, as this
            // internal data object is undocumented and subject to change.
            if (name === "events" && !thisCache[name]) {
                return thisCache[internalKey] && thisCache[internalKey].events;
            }
            // 如果name是字符串，则返回data
            // 如果不是，则返回整个存储对象
            return getByName ? thisCache[jQuery.camelCase(name)] : thisCache;
        },
        // 在指定元素上移除存放的数据
        removeData: function (elem, name, pvt /* Internal Use Only */ ) {
            if (!jQuery.acceptData(elem)) {
                return;
            }
            var internalKey = jQuery.expando,
                isNode = elem.nodeType,
                // See jQuery.data for more information
                cache = isNode ? jQuery.cache : elem,
                // See jQuery.data for more information
                id = isNode ? elem[jQuery.expando] : jQuery.expando;
            // If there is already no cache entry for this object, there is no
            // purpose in continuing
            if (!cache[id]) {
                return;
            }
            if (name) {
                var thisCache = pvt ? cache[id][internalKey] : cache[id];
                if (thisCache) {
                    delete thisCache[name];
                    // If there is no data left in the cache, we want to continue
                    // and let the cache object itself get destroyed
                    if (!isEmptyDataObject(thisCache)) {
                        return;
                    }
                }
            }
            // See jQuery.data for more information
            if (pvt) {
                delete cache[id][internalKey];
                // Don't destroy the parent cache unless the internal data object
                // had been the only thing left in it
                if (!isEmptyDataObject(cache[id])) {
                    return;
                }
            }
            var internalCache = cache[id][internalKey];
            // Browsers that fail expando deletion also refuse to delete expandos on
            // the window, but it will allow it on all other JS objects; other browsers
            // don't care
            // 如果不支持在DOM元素上delete，设置为null
            if (jQuery.support.deleteExpando || cache != window) {
                delete cache[id];
            } else {
                cache[id] = null;
            }
            // We destroyed the entire user cache at once because it's faster than
            // iterating through each key, but we need to continue to persist internal
            // data if it existed
            // // 如果还有数据，就清空一次再设置，增加性能
            if (internalCache) {
                cache[id] = {};
                // TODO: This is a hack for 1.5 ONLY. Avoids exposing jQuery
                // metadata on plain JS objects when the object is serialized using
                // JSON.stringify
                if (!isNode) {
                    cache[id].toJSON = jQuery.noop;
                }
                cache[id][internalKey] = internalCache;
                // Otherwise, we need to eliminate the expando on the node to avoid
                // false lookups in the cache for entries that no longer exist
                // 已经没有任何数据了，就全部删除
            } else if (isNode) {
                // IE does not allow us to delete expando properties from nodes,
                // nor does it have a removeAttribute function on Document nodes;
                // we must handle all of these cases
                // 如果支持delete，就删除。
                // IE使用removeAttribute，所以尝试一次。再失败就只能设置为null了。
                if (jQuery.support.deleteExpando) {
                    delete elem[jQuery.expando];
                } else if (elem.removeAttribute) {
                    elem.removeAttribute(jQuery.expando);
                } else {
                    elem[jQuery.expando] = null;
                }
            }
        },
        // For internal use only.
        // 内部使用
        _data: function (elem, name, data) {
            return jQuery.data(elem, name, data, true);
        },
        // A method for determining if a DOM node can handle the data expando
        // YunG:
        // 判断一个DOM元素是否可以附加数据
        acceptData: function (elem) {
            if (elem.nodeName) {
                // embed object applet
                var match = jQuery.noData[elem.nodeName.toLowerCase()];
                if (match) {
                    // return match === true
                    // return elem.getAttribute("classid") !== match
                    return !(match === true || elem.getAttribute("classid") !== match);
                }
            }
            return true;
        }
    });
});