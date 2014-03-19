(function($){
    $.fn.inViewPort = function(options){
        var $win = $(window);
        var b = true;
        var settings = $.extend({},options);
        if(settings.container){
            b = elementInViewport($(this),getRegion(),getRegion($(settings.container)));
        }else{
            b = elementInViewport($(this),getRegion());
        }
        return b;
        function cacheWidth($this) {
            if ($this.outerWidth) {
                return $this.outerWidth();
            }
            return $this.outerWidth = $this.outerWidth();
        }
        function cacheHeight($this) {
            if ($this.outerHeight) {
                return $this.outerHeight();
            }
            return $this.outerHeight = $this.outerHeight();
        }

        // 两块区域是否相交
        function isCross(r1, r2) {
            var r = {};
            r.top = Math.max(r1.top, r2.top);
            r.bottom = Math.min(r1.bottom, r2.bottom);
            r.left = Math.max(r1.left, r2.left);
            r.right = Math.min(r1.right, r2.right);
            return r.bottom >= r.top && r.right >= r.left;
        }
        //元素在显示区域内
        function elementInViewport($this, windowRegion, containerRegion) {
            // it's better to removeElements,
            // but if user want to append it later?
            // use addElements instead
            // if (!inDocument(elem)) {
            //    return false;
            // }
            // display none or inside display none
            if (!$this.is(':visible')) {
                return false;
            }
            var elemOffset = $this.offset(),
                inContainer = true,
                inWin,
                left = elemOffset.left,
                top = elemOffset.top,
                elemRegion = {
                    left: left,
                    top: top,
                    right: left + cacheWidth($this),
                    bottom: top + cacheHeight($this)
                };
            inWin = isCross(windowRegion, elemRegion);
            if (inWin && containerRegion) {
                inContainer = isCross(containerRegion, elemRegion);
            }
            // 确保在容器内出现
            // 并且在视窗内也出现
            return inContainer && inWin;
        }

        //获得元素坐标
        function getRegion($this) {
            var vh, vw, left, top, right,bottom;
            var $win = $(window);
            if ($this !== undefined) {
                vh = $this.outerHeight();
                vw = $this.outerWidth();
                var offset = $this.offset();
                left = offset.left;
                top = offset.top;
            } else {
                vw = $win.width();
                vh =  $win.height();
                left =$win.scrollLeft();
                top = $win.scrollTop();
            }
            right = left + vw;
            bottom = top + vh;
            var diff = settings.diff;
            var objDiff = {};
            if(typeof (diff) !== 'object'){
                objDiff.left = parseInt(diff) || 200;
                objDiff.top = parseInt(diff) || 200;
            }else{
                objDiff = diff;
            }
            left -= objDiff.left || 0;
            right += objDiff.right || 0;
            top -= objDiff.top || 0;
            bottom += objDiff.bottom || 0;
            return {
                left: left,
                top: top,
                right: right,
                bottom: bottom
            };
        }

    }
    $.fn.lazyCallback = function(options){
        var elements = this;
        var time = new Date().getTime()+ Math.random()+Math.random();
        var timer = null;
        var $win = $(window);
        var settings = {
            callback: function(){}
        };
        if($.isFunction(options)){
            settings.callback = options;
        }else{
            $.extend(settings, options);
        }

        $win.on("scroll.lazyCallback"+time+",resize.lazyCallback"+time, function() {
            timer && clearTimeout(timer);
            timer = setTimeout(update,100);
        });
        $(document).ready(function() {
            update();
        });
        function update(){
            var arrId = [];
            if(!elements.length){
                $win.off("scroll.lazyCallback"+time+",resize.lazyCallback"+time);
                return false;
            }
            elements.each(function(i) {
                var $this = $(this);
                if (settings.skipInvisible && !$this.is(":visible")) {
                    return;
                }
                if($this.inViewPort(options)){ //是否在可视区域
                    !$this.data('lazySuccess') && settings.callback && settings.callback.call(this);
                    $this.data('lazySuccess', 'lazySuccess');
                    arrId.push(i);
                }
            });
            $.each(arrId,function(i){
                if(elements.eq(arrId[i]).data('lazySuccess') === 'lazySuccess'){    //再次验证该元素是否替换成功
                    elements.splice(arrId[i],1);
                }

            })
        }
    };
    $.fn.lazyTextarea = function(options){
        var elements = this;
        var time = new Date().getTime()+ Math.random()+Math.random();
        var timer = null;
        var $win = $(window);
        var settings = {
            callback: function(){}
        };
        if($.isFunction(options)){
            settings.callback = options;
        }else{
            $.extend(settings, options);
        }

        $win.on("scroll.lazyTextarea"+time+",resize.lazyTextarea"+time, function() {
            timer && clearTimeout(timer);
            timer = setTimeout(update,100);
        });
        $(document).ready(function() {
            update();
        });
        function update(){
            var arrId = [];
            if(!elements.length){
                $win.off("scroll.lazyTextarea"+time+",resize.lazyTextarea"+time);
                return false;
            }
            elements.each(function(i) {
                var $this = $(this);
                if (settings.skipInvisible && !$this.is(":visible")) {
                    return;
                }
                if($this.inViewPort(options)){ //是否在可视区域
                    var sVal = $.trim($this.val());
                    var $div =  $('<div>'+sVal+'</div>');
                    $div.find('script').remove();
                    $this.before($div);
                    $this.hide();
                    $this[0].className = '';
                    !$this.data('lazyTextarea') && settings.callback && settings.callback.call($div);
                    $this.data('lazyTextarea', 'lazySuccess');
                    arrId.push(i);
                }
            });
            $.each(arrId,function(i){
                if(elements.eq(arrId[i]).data('lazyTextarea') === 'lazySuccess'){    //再次验证该元素是否替换成功
                    elements.splice(arrId[i],1);
                }

            })
        }
    };
    $.fn.lazyloadImg = function(options) {
        var elements = this;
        var $win = $(window);
        var timer = null;
        var time = new Date().getTime()+ Math.random()+Math.random();
        var settings = {
            dataAttr :  'data-img',
            container       : window,
            skipInvisible  : true,
            placeholder     : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC"
        };
        $.extend(settings, options);
        $win.on("scroll.lazyloadImg"+time+",resize.lazyloadImg"+time, function() {
            timer && clearTimeout(timer);
            timer = setTimeout(update,100);
        });
        $(document).ready(function() {
            update();
        });
        //更新监测
        function update() {
            if(!elements.length){
                $win.off("scroll.lazyloadImg"+time+",resize.lazyloadImg"+time);
                return false;
            }
            var arrId = [];
            elements.each(function(i) {
                var $this = $(this);
                if (settings.skipInvisible && !$this.is(":visible")) {
                    return;
                }
                fDataUrl($this);
                if($this.inViewPort(options)){ //是否在可视区域
                    $this.attr('src',$this.data('src') || settings.dataAttr);
                    $this.removeAttr(settings.dataAttr);
                    arrId.push(i);
                }
            });
            $.each(arrId,function(i){
                if(elements.eq(arrId[i]).attr('src') === elements.eq(arrId[i]).data('src')){    //再次验证该元素图片是否替换成功
                    elements.splice(arrId[i],1);
                }

            })
        }
        //保存url
        function fDataUrl ($this){
            var url = $this.attr("src");
            if (url && url !== settings.placeholder) {
                $this.attr("src", settings.placeholder || '');
                if(!$this.data('src')){
                    if($this.attr(settings.dataAttr)){
                        $this.data('src', $this.attr(settings.dataAttr));
                    }else{
                        $this.data('src',url);
                    }
                }
            }else{
                !$this.data('src') && $this.data('src', $this.attr(settings.dataAttr));
            }
        }
        return this;
    };
    $.fn.lazyload = function(options) {
        var elements = this;
        var $win = $(window);
        var timer = null;
        var time = new Date().getTime()+ Math.random()+Math.random();
        var settings = {
            dataAttr :  'data-src',
            clearScript: false,
            skipInvisible  : true,
            callback: function(){},
            diff: 20,
            delay: 100,
            placeholder     : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC"
        };
        $.extend(settings, options);
        $win.on("scroll.lazyload"+time+",resize.lazyload"+time, function() {
            timer && clearTimeout(timer);
            timer = setTimeout(update,settings.delay);
        });
        $(document).ready(function() {
            update();
        });
        //更新监测
        function update() {
            if(!elements.length){
                $win.off("scroll.lazyload"+time+",resize.lazyload"+time);
                return false;
            }
            var arrId = [];
            elements.each(function(i) {
                var $this = $(this);
                if (settings.skipInvisible && !$this.is(":visible")) {
                    return;
                }
                ($this.get(0).nodeName.toLowerCase() === 'img') &&  fDataUrl($this);
                if($this.inViewPort(options)){ //是否在可视区域
                    fLazyloadSuceess($this);
                    $this.data('lazyloadSuceess','lazyloadSuceess');
                    arrId.push(i);
                }
            });
            $.each(arrId,function(i){
                if(elements.eq(arrId[i]).data('lazyloadSuceess') === 'lazyloadSuceess'){    //再次验证该元素是否执行成功
                    if((elements.eq(arrId[i]).get(0).nodeName.toLowerCase() === 'img') && (elements.eq(arrId[i]).attr('src') !== elements.eq(arrId[i]).data('src'))){  //对于替换图片需要进一步确认是否已经成功
                    }else{
                        elements.splice(arrId[i],1);
                    }

                }

            })
        }
        function fLazyloadSuceess ($this){
            if($this.get(0).nodeName.toLowerCase() === 'img') {
                $this.attr('src',$this.data('src'));
                !$this.data('lazyloadSuceess') && settings.callback && settings.callback.call($this);
            }else if ($this.get(0).nodeName.toLowerCase() === 'textarea'){
                var sVal = $.trim($this.val());
                var $div =  $('<div>'+sVal+'</div>');
                settings.clearScript && $div.find('script').remove();  //如果需要清除script
                $this.before($div);
                $this.hide();
                $this[0].className = '';
                !$this.data('lazyloadSuceess') && settings.callback && settings.callback.call($div);
            }else{
                !$this.data('lazyloadSuceess') && settings.callback && settings.callback.call($this);
            }
        }
        //保存url
        function fDataUrl ($this){
            var url = $this.attr("src");
            if (url && url !== settings.placeholder) {
                if(!$this.data('src')){
                    if($this.attr(settings.dataAttr)){
                        $this.data('src', $this.attr(settings.dataAttr));
                    }else{
                        $this.data('src',url);
                    }
                }else{
                    $this.attr("src", settings.placeholder || '');
                }
            }else{
                !$this.data('src') && $this.data('src', $this.attr(settings.dataAttr));
            }
        }
        return this;
    };
})(jQuery)