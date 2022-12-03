export default {
  flatten: function(ary) {
    return ary.reduce((a, b) => a.concat(b));
  },

  flatMap: function(ary, lambda) {
    return Array.prototype.concat.apply([], ary.map(lambda));
  },

  cartesianProduct: function(ary1, ary2) {
    return this.flatten(ary1.map(x => ary2.map(y => [x, y])));
  },

  randomID: function(prefix) {
    const str = [0, 1, 2, 3].map(() => {
      return Math.floor(Math.random() * 0x10000).toString(16).substring(1);
    }).join("");

    return `${prefix}-${str}`;
  },

  clone: function(element) {
    return element.cloneNode(true);
  },

  createElement: function(elementName, options) {
    const element = document.createElement(elementName);

    if (typeof options !== "undefined") {
      if (options.class) {
        element.className = options.class;
      }
    }

    return element;
  },

  createSVGElement: function(elementName, options) {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const element = document.createElementNS(svgNamespace, elementName);

    if (typeof options !== "undefined") {
      if (options.class) {
        options.class.split(" ").forEach(name => {
          this.addClass(element, name);
        });
      }

      if (options.attributes) {
        Object.keys(options.attributes).forEach(k => {
          element.setAttribute(k, options.attributes[k]);
        });
      }

      if (options.text) {
        element.textContent = options.text.toString();
      }
    }

    return element;
  },

  appendElement: function(parent, el) {
    parent.insertBefore(el, null);
  },

  addEventListener: function(el, eventName, fn) {
    el.addEventListener(eventName, fn, false);
  },

  removeClass: function(el, className) {
    if (!this.hasClass(el, className)) {
      return;
    }

    if (el.classList && el.classList.remove) {
      el.classList.remove(className);
      return;
    }

    const classNameRegex = RegExp('\\b' + className + '\\b', "g");

    if (el instanceof SVGElement) {
      el.setAttribute("class", el.getAttribute("class").replace(classNameRegex, ""));
    } else {
      el.className = el.getAttribute("class").replace(classNameRegex, "");
    }
  },

  addClass: function(el, className) {
    if (el.classList && el.classList.add) {
      el.classList.add(className);
      return;
    }

    if (el instanceof SVGElement) {
      el.setAttribute("class", el.getAttribute("class") + " " + className);
    } else {
      el.className = el.getAttribute("class") + " " + className;
    }
  },

  hasClass: function(el, className) {
    if (el.classList && el.classList.contains) {
      return el.classList.contains(className);
    }

    const classNameRegex = RegExp('\\b' + className + '\\b', "g");

    if (el instanceof SVGElement) {
      return classNameRegex.test(el.getAttribute("class"));
    } else {
      return classNameRegex.test(el.className);
    }
  },

  toggleClass: function(el, className) {
    if (el.classList && el.classList.toggle) {
      el.classList.toggle(className);
      return;
    }

    if (this.hasClass(el, className)) {
      this.removeClass(el, className);
    } else {
      this.addClass(el, className);
    }
  },

  unique: function(ary) {
    let unique = [];
    ary.forEach(el => {
      if (unique.indexOf(el) < 0) {
        unique.push(el);
      }
    });
    return unique;
  },

  sgfCoordToPoint:function(_18a){
	if(!_18a||_18a=="tt"){
		return {x:null,y:null};
	}
	var _18b={a:0,b:1,c:2,d:3,e:4,f:5,g:6,h:7,i:8,j:9,k:10,l:11,m:12,n:13,o:14,p:15,q:16,r:17,s:18};
	return {x:_18b[_18a.charAt(0)],y:_18b[_18a.charAt(1)]};
  },

  pointToSgfCoord:function(pt){
	if(!pt||(this.board&&!this.boundsCheck(pt.x,pt.y,[0,this.board.boardSize-1]))){
		return "";
	}
	var pts={0:"a",1:"b",2:"c",3:"d",4:"e",5:"f",6:"g",7:"h",8:"i",9:"j",10:"k",11:"l",12:"m",13:"n",14:"o",15:"p",16:"q",17:"r",18:"s"};
	return pts[pt.x]+pts[pt.y];
  }
};
