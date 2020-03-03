//browser.js
var wxLogin=wxLogin || (function(window){
	
	// let enterPage = sessionStorage.getItem('enterPage');
	// if(!enterPage)sessionStorage.setItem('enterPage',locationUrl);

	let wxLoginClass={
		getPlateform:function(){
			let fl = sessionStorage.getItem("plateform");//20190528更新
			if(!fl){//20190528更新 增加判断
				var browser = {
					versions: function () {
						var u = navigator.userAgent, app = navigator.appVersion;
						return {
							winWechat: u.indexOf('WindowsWechat') > -1,
							mp: u.indexOf('MicroMessenger') > -1&&u.indexOf('WindowsWechat') < 0, 
							alipay_H5: u.indexOf('Alipay') > -1,
							taoBao_H5:u.indexOf('tao') > -1,
							chrome : u.indexOf('Chrome') > -1&&window.chrome
						};
					}(),
					language: (navigator.browserLanguage || navigator.language).toLowerCase()
				};
				for(var i in browser.versions){
					if(browser.versions[i]){
						fl = i
					}
				}
				// browser.versions.chromeSimulate = window.i == "chromeSimulate";//chrome模拟器判断
				sessionStorage.setItem("plateform",fl);
				console.log(browser.versions)
			}
			return fl
		},
		getSysterm(){
			//获取系统标识
			let systerm = localStorage.getItem("systerm");//20190528更新
			if(!systerm){ //20190528更新 增加判断
				let UA = window.navigator.userAgent.toLowerCase();
				let isAndroid = UA.indexOf('android') > 0;
				let isIOS = /iphone|ipad|ipod|ios/.test(UA); //待测试
				systerm = isIOS?'IOS':(isAndroid?'Android':'other')
				console.log(systerm);
				localStorage.setItem('systerm',systerm);
			}
			return  systerm
		},
		toWxLogin(){
			let systerm = this.getSysterm();
			let plateform = this.getPlateform()
			let locationUrl = window.location.href;//获取当前地址
			let split_index = locationUrl.indexOf("#"),
			hash_str = window.location.hash;//直接获取hash
			// if(split_index>-1){
			// 	paramer_str = locationUrl.substring(split_index,locationUrl.length);
			// }else{
			// 	paramer_str = "#/"
			// }
			let directUrl = window.location.origin+"/"+hash_str;
			console.log("微信跳转地址："+directUrl);
			let wxRedirect_uri="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx4a09bd8e35d82654&redirect_uri="+encodeURIComponent(directUrl)+"&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect";
			/***20190529更新*****/
			//获取路由地址
			let forcedLogin =  sessionStorage.getItem("forcedLogin");
			let paramIndex = hash_str.indexOf("?");
			let pathName = "";
			if(paramIndex>0){
				pathName = hash_str.substring(1,paramIndex)
			}else{
				pathName = hash_str.substring(1,hash_str.length);
			}
			let singlePage = [
				"/pages/player/index",
				"/pages/docText/index",
				"/pages/mantra/classicDetail",
				"/pages/video/videoDetail",
				"/pages/QA/QAdetail",
				"/pages/liveBroadcast/index"
			]
			//判断是不分享单页面 和是否有强制登录标识
			if(singlePage.indexOf(pathName)<0 || forcedLogin ){
				//判断是否是微信浏览器
				if (plateform=='mp') {
						//如果是微信浏览器器 且不是player页面,就前往微信认证
							//获取sessionKey
							let sessionKey =localStorage.getItem('lihan_session_key');
							if(!sessionKey){
								let wxLoginFlag = sessionStorage.getItem('wxLoginFlag');
								//判断控制标识值是否有值
								if(wxLoginFlag != '1'){
									sessionStorage.setItem("wxLoginFlag","1");//设置标识为1
									//等到document加完,显示loading
									document.onReady =  function(){
										document.getElementById("loading").style.display = 'block';
									}
									window.location.replace(wxRedirect_uri)//跳转微信
								}
							}
				}
			}else{
				
			}
		},
		toLogin(vm){
			if(this.getPlateform() == 'mp'){
				uni.showModal({
					title:"登录提示",
					content:"您现在未登录，请登录后再操作",
					confirmText:"去登录",
					confirmColor:"#C3BEB4",
					success: function (res) {
							if (res.confirm) {
									window.location.reload()
									//用户点击确定
							} else if (res.cancel) {
										//用户点击取消
							}
					}
					
				})
			}else{
				//如果是其它，弹出播放框
				vm.$store.commit("setIsShowRestor",true);
			}
		},
		getUserCode(){
			let  locationUrl = window.location.href;
			let codeIndex = locationUrl.indexOf("code");
			let code = "";
			if(codeIndex>-1){
				let paramer_str = locationUrl.substring(codeIndex,locationUrl.length);
				let paramer_arr = paramer_str.split("&");
				for(var i in paramer_arr){
					let  par_item = paramer_arr[i].split("=");
					//如果返回的参数中带code,怎保存code
					if(par_item[0] == 'code'){
						code = par_item[1];
					}
				}
			}
			return code;
			console.log(code);
		},
		failHand(vm){
				let plateform = vm.$store.state.plateform;
			/*****20190531 更新*****/
				//如果后台返回失败状态码401.标识sessionkey失效，则清空sessionkey和时间戳
						localStorage.removeItem('lihan_session_key');
						localStorage.removeItem('lihan_timestamp');
						uni.removeStorageSync('session_key');
						//如果是微信，弹出登录提示,确定后重新加载页面
						if(plateform == 'mp'){
							uni.showModal({
								title:"登录提示",
								content:"您现在未登录，请登录后再操作",
								confirmText:"去登录",
								confirmColor:"#C3BEB4",
								success: function (res) {
										if (res.confirm) {
												window.location.reload()
												//用户点击确定
										} else if (res.cancel) {
													//用户点击取消
										}
								}
								
							})
						}else{
							//如果是其它，弹出播放框
							vm.$store.commit("setIsShowRestor",true);
						}
			/*****20190531 更新*****/
		},
		WCPayRequest(option,callback){
			WeixinJSBridge.invoke(
				'getBrandWCPayRequest', option,
				function(res){
				if(res.err_msg == "get_brand_wcpay_request:ok" ){
				// 使用以上方式判断前端返回,微信团队郑重提示：
							//res.err_msg将在用户支付成功后返回ok，但并不保证它绝对可靠。
				} 
		 }); 
		}
	};

	//定义浏览器类型(获取平台标识)
	/*--20190523 更新代码-*/
	
		//获取及缓存入口页面
		
		/*--20190523 end-*/
		/*--20190520 end--*/
		//判断sessionKey,
		// if(!sessionKey){
		// 	let userCode = sessionStorage.getItem('userCode');
		// 	//判断是否存在,如果不存在,判断是否是微信浏览器,
		// 	if(!userCode){
		// 		if (browser.versions.weixin && !browser.versions.winWechat) {
		// 			//如果是微信浏览器器 且不是player页面,就前往微信认证
		// 			if(locationUrl.indexOf("pages/player")<0 ){
		// 				sessionStorage.setItem('enterPage',locationUrl);
		// 				location.href = location.origin+'/wxLogin/';
		// 				document.onReady =  function(){
		// 					document.getElementById("loading").style.display = 'block';
		// 				}
		// 			}
		// 		}
		// 	}
		// }
		// let cookie = document.cookie;
		// let Days = 15;
		// let exp = new Date();
		// exp.setTime(exp.getTime() + Days*24*60*60*1000);
		// document.cookie = "timetamp" + "="+ escape (value) + ";expires=" + exp.toGMTString();
		
		/*--20190523 更新代码--*/
		/*判断微信登录标识wxLoginFlag
			* 1-进入微信登录，未跳转微信登录认证
			* 2-已获取微信code，还未获取sessionkey
			* 3-已获取sessionkey
		*/
		
		// if(wxLoginFlag == '1'){//入参携带code,缓存code重定向
		// 	//获取带入的参数,如果参数存在,则判断参数是否为code,如果是保存到session中,如果不是则重新跳转微信认证.如果参数不存在,则跳转到微信认证
		// 	let paramer_str=window.location.search;
		// 	paramer_str=paramer_str.split("?")[1];
		// 	/**20190525 更新**/
		// 	let paramer_arr =paramer_str.split("&");
		// 	let paramerKey="",code="",rTime = sessionStorage.getItem("rtime")||0;
		// 	//遍历返回的参数
		// 	for(var i in paramer_arr){
		// 		let  par_item = paramer_arr[i].split("=");
		// 		//如果返回的参数中带code,怎保存code
		// 		if(par_item[0] == 'code'){
		// 			code = par_item[1];
		// 		}
		// 	}
		// 	//如果code存在,跳转到入口页
		// 	if(code){
		// 		sessionStorage.setItem("userCode",code);
		// 		sessionStorage.setItem("wxLoginFlag","2");//设置标识为2
		// 		if(enterPage)window.location.href = enterPage;//跳回入口页
		// 	}else
		// 	if(!rTime){
		// 		//否通则重新请求登录
		// 		sessionStorage.setItem("rtime",'1');
		// 		window.location.replace(redirect_uri);//跳转微信认证
		// 	}
		// 	/**20190525 end**/
		// }
		//else wxLoginFlag为2,3时,正常走流程即可
		//获取当前时间
		//let curTimestamp = (new Date()).getTime();
		// if((curTimestamp - timestamp)> expire*24*3600){
		// 	localStorage.setItem('lihan_session_key':'');
		// }
// 	let wxCLASS= {};
// 	wxCLASS.prototype = wxLoginClass
	return wxLoginClass	

})(window);
