(function(global, factory){
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.RScrollControl = factory());
})(this, function(){ 'use strict';

  
  /**
   * 禁止scroll 基于touch+translate的2D滚动器
   */
  function isDef(value) {
    return !(value === undefined || typeof(value) === undefined);
  }
  function getValueForObject(param, defaultValue) {
    return typeof(param) === 'object' ? param :  !isDef(defaultValue) ? {} : getValueForObject(defaultValue);
  }
  function getValueForString(param, defaultValue) {
    return typeof(param) === 'string' ? param :  !isDef(defaultValue) ? '' : getValueForString(defaultValue);
  }
  function getValueForInteger(param, defaultValue) {
    return Math.floor(param) === param ? param :  !isDef(defaultValue) ? 0 : getValueForInteger(defaultValue);
  }
  function getValueForBoolean(param, defaultValue) {
    return typeof(param) === 'boolean' ? param :  !isDef(defaultValue) ? false : getValueForString(defaultValue);
  }


  var RScroll = function (ctxs, options) {

    this.direction = 'h'
    this.ctxs = ctxs;
    this.cur = 0;
    this.isDown = false;
    this.v = 0;   // 速度
    this.fl = 150;   // 弹力系数 惯性
    this.offset = 50  // 回弹偏移
  }

  RScroll.prototype.init = function () {

    // 添加监听
    var self = this;
    this.ctxs.forEach(function (ctx) {
      ctx.style.overflow = 'hidden';
      var wrapper = ctx.firstElementChild || ctx.firstChild;
      wrapper.style.width = 'max-content';
      ctx.addEventListener("touchstart", function (e) {
        e.preventDefault();
        if (self.isInTransition)return;//如果在滚动中，则中止执行
        clearTimeout(this._timer);//清除定时器
        self.v = 0;
        this._d = self.direction === 'h' ? e.changedTouches[0].clientX - self.cur : e.changedTouches[0].clientY - self.cur;
        this._c = self.direction === 'h' ? e.changedTouches[0].clientX : e.changedTouches[0].clientY;
        this._s = self.direction === 'h' ? this.scrollWidth :this.scrollHeight;
        this._startTime = e.timeStamp;//鼠标按下时的时间戳
        self.isDown = true;//鼠标是否有按下，主要防止用户是从容器外开始滑动的

      });
      ctx.addEventListener("touchmove", function (e) {
        e.preventDefault();
        if (self.isDown) {//如果鼠标是从容器里开始滑动的
          if (e.timeStamp - this._startTime > 40) {//如果是慢速滑动，就不会产生力度，列表是跟着鼠标移动的
              this._startTime = e.timeStamp;//慢速滑动不产生力度，所以需要实时更新时间戳
              var cur = self._c = (self.direction === 'h' ? e.changedTouches[0].clientX : e.changedTouches[0].clientY) - this._d;
              var fl = self.fl;
              if (cur > 0) {//如果列表位置大于0,既鼠标向下滑动并到顶时
                cur *= fl / (fl + cur);//列表位置带入弹力模拟,公式只能死记硬背了,公式为:位置 *=弹力/(弹力+位置)
              }else if (cur < this._c - this._s) {//如果列表位置小于 容器高度减列表高度(因为需要负数,所以反过来减),既向上滑动到最底部时。
                //当列表滑动到最底部时,cur的值其实是等于 容器高度减列表高度的,假设窗口高度为10,列表为30,那此时cur为 10 - 30 = -20,但这里的判断是小于,所以当cur<-20时才会触发,如 -21;
                cur += this._s - this._c;//列表位置加等于 列表高度减容器高度(这是与上面不同,这里是正减,得到了一个正数) ,这里 cur 为负数,加上一个正数,延用上面的假设,此时 cur = -21 + (30-10=20) = -1 ,所以这里算的是溢出数

//                        console.log(cur);
                cur = cur * fl / (fl - cur) - this._s + this._c;//然后给溢出数带入弹力,延用上面的假设,这里为   cur = -1 * 150 /(150 - -1 = 151)~= -0.99 再减去 30  等于 -30.99  再加上容器高度 -30.99+10=-20.99  ,这也是公式,要死记。。
            }
            self.setPos(cur);//移动列表
          }
          self.v = (self.direction === 'h' ? e.changedTouches[0].clientX : e.changedTouches[0].clientY) - this._c;//记录本次移动后,与前一次鼠标位置的滑动的距离,快速滑动时才有效,慢速滑动时差值为 1 或 0,vy可以理解为滑动的力度
          this._c = self.direction === 'h' ? e.changedTouches[0].clientX : e.changedTouches[0].clientY ;
        }
      }, false);
      ctx.addEventListener("touchend", function(e){
        e.preventDefault()
        if (self.isDown) {
          self.isDown = false;
          var v = self.v;
          var friction = ((v >> 31) * 2 + 1) * 0.5,//根据力度套用公式计算出惯性大小,公式要记住 计算出两个轴的惯性
          sc = self.direction === 'h' ? this.scrollWidth- this.clientWidth:this.scrollHeight - this.clientHeight;
          var cur = self.cur;
          var offset = self.offset;
          var t = this;
          this._timer = setInterval(function () {//
            v -= friction;//力度按 惯性的大小递减
            cur += v;//转换为额外的滑动距离
            self.setPos(cur);//滑动列表

            // 超出回弹 力度大的时候回弹 采取偏移量回弹
            if (-cur - sc > offset) {//如果列表底部超出了
              clearTimeout(t._timer);
              self.ease(t, -sc);//回弹
              return;
          }
          if (cur > offset) {//如果列表顶部超出了
              clearTimeout(t._timer);
              self.ease(t, 0);//回弹
              return;
          }
          if (Math.abs(v) < 1) {//如果力度减小到小于1了,再做超出回弹
              clearTimeout(t._timer);
              if (cur > 0) {
                  self.ease(t, 0);
                  return;
              }
              if (-cur > sc) {
                  self.ease(t, -sc);
                  return;
              }
          }
            
          }, 20);

          

        }
      });
    });
    
  }


  // 设定位置
  RScroll.prototype.setPos = function (cur) {
    
    var self = this;

    var _s = self.direction === 'h'?self.ctxs[0].scrollWidth : ctxs[0].scrollHeight;
    var _c = self.direction === 'h'?self.ctxs[0].clientWidth : ctxs[0].clientHeight;
    
    this.ctxs.forEach(function(ctx){
      var wrapper = ctx.firstElementChild || ctx.firstChild;
      

      if(!wrapper || ctx.children.length > 1){ throw "num of container's wrapper is only one!"}
      if(self.direction === 'h'){
        if(ctx.clientWidth && ctx.scrollWidth && ctx.scrollWidth > ctx.clientWidth){
          if(_c !== ctx.clientWidth || _s !== ctx.scrollWidth){
            throw "同步滚动条大小不一致！"
          }
          wrapper.style.transform = "translateX(" + cur + "px) translateZ(0)";
          self.cur = cur;
        }
      }else if(self.direction === 'v'){
        if(ctx.clientHeight && ctx.scrollHeight && ctx.scrollHeight > ctx.clientHeight){
          if(_c !== ctx.clientHeight|| _s !== ctx.scrollHeight){
            throw "同步滚动条大小不一致！"
          }
          wrapper.style.transform = "translateY(" + cur + "px) translateZ(0)";
          self.cur = cur;
        }
      }else {
        throw "未指定滑动方向！"
      }
      
      
    })

  }
 
  RScroll.prototype.ease = function (ctx, target) {
    var self = this;
    self.isInTransition = true;
    var cur = self.cur;
    ctx._timer = setInterval(function () {//回弹算法为  当前位置 减 目标位置 取2个百分点 递减
        cur -= (cur - target) * 0.2;
        if (Math.abs(cur - target) < 1) {//减到 当前位置 与 目标位置相差小于1 之后直接归位
            cur = target;
            clearInterval(ctx._timer);
            self.isInTransition = false;
        }
        self.setPos(cur);
    }, 20);
  }

  var RScrollControl = function (options) {
    
    this.options = getValueForObject(options);
    this.scrolls = new Object();
    this.offset = getValueForInteger(this.options.offset, 50);
  };

  RScrollControl.prototype.add = function (style, options){
    style = getValueForString(style);
    var ctxs = document.querySelectorAll('.'+style);
    if(ctxs instanceof(NodeList) && ctxs.length < 1){ return; }
    var scroll = new RScroll(ctxs, options);
    scroll.init();
    this.scrolls[style] = scroll;
  }

  return RScrollControl;


})