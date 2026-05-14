(function () {

	var previewForm = document.getElementById('previewform');

	var url = location.search.substring(1).replace(/\/\/github\.com/, '//raw.githubusercontent.com').replace(/\/blob\//, '/'); //Get URL of the raw file

	var isMarkdown = function (u) {
		return /\.md$/i.test(u.split('?')[0]);
	};

	var replaceAssets = function () {
		var frame, a, link, links = [], script, scripts = [], i, href, src;
		//Framesets
		if (document.querySelectorAll('frameset').length)
			return; //Don't replace CSS/JS if it's a frameset, because it will be erased by document.write()
		//Frames
		frame = document.querySelectorAll('iframe[src],frame[src]');
		for (i = 0; i < frame.length; ++i) {
			src = frame[i].src; //Get absolute URL
			if (src.indexOf('//raw.githubusercontent.com') > 0 || src.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
				frame[i].src = '//' + location.hostname + location.pathname + '?' + src; //Then rewrite URL so it can be loaded using CORS proxy
			}
		}
		//Links
		a = document.querySelectorAll('a[href]');
		for (i = 0; i < a.length; ++i) {
			href = a[i].href; //Get absolute URL
			if (href.indexOf('#') > 0) { //Check if it's an anchor
				a[i].href = '//' + location.hostname + location.pathname + location.search + '#' + a[i].hash.substring(1); //Then rewrite URL with support for empty anchor
			} else if ((href.indexOf('//raw.githubusercontent.com') > 0 || href.indexOf('//bitbucket.org') > 0) && (href.indexOf('.html') > 0 || href.indexOf('.htm') > 0 || href.indexOf('.md') > 0)) { //Check if it's from raw.github.com or bitbucket.org and to HTML or Markdown files
				a[i].href = '//' + location.hostname + location.pathname + '?' + href; //Then rewrite URL so it can be loaded using CORS proxy
			}
		}
		//Stylesheets
		link = document.querySelectorAll('link[rel=stylesheet]');
		for (i = 0; i < link.length; ++i) {
			href = link[i].href; //Get absolute URL
			if (href.indexOf('//raw.githubusercontent.com') > 0 || href.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
				links.push(fetchProxy(href, null, 0)); //Then add it to links queue and fetch using CORS proxy
			}
		}
		Promise.all(links).then(function (res) {
			for (i = 0; i < res.length; ++i) {
				loadCSS(res[i]);
			}
		});
		//Scripts
		script = document.querySelectorAll('script[type="text/htmlpreview"]');
		for (i = 0; i < script.length; ++i) {
			src = script[i].src; //Get absolute URL
			if (src.indexOf('//raw.githubusercontent.com') > 0 || src.indexOf('//bitbucket.org') > 0) { //Check if it's from raw.github.com or bitbucket.org
				scripts.push(fetchProxy(src, null, 0)); //Then add it to scripts queue and fetch using CORS proxy
			} else {
				script[i].removeAttribute('type');
				scripts.push(script[i].innerHTML); //Add inline script to queue to eval in order
			}
		}
		Promise.all(scripts).then(function (res) {
			for (i = 0; i < res.length; ++i) {
				loadJS(res[i]);
			}
			document.dispatchEvent(new Event('DOMContentLoaded', {bubbles: true, cancelable: true})); //Dispatch DOMContentLoaded event after loading all scripts
		});
	};

	var loadHTML = function (data) {
		if (data) {
			data = data.replace(/<head([^>]*)>/i, '<head$1><base href="' + url + '">').replace(/<script(\s*src=["'][^"']*["'])?(\s*type=["'](text|application)\/javascript["'])?/gi, '<script type="text/htmlpreview"$1'); //Add <base> just after <head> and replace <script type="text/javascript"> with <script type="text/htmlpreview">
			setTimeout(function () {
				document.open();
				document.write(data);
				document.close();
				replaceAssets();
			}, 10); //Delay updating document to have it cleared before
		}
	};

	var loadCSS = function (data) {
		if (data) {
			var style = document.createElement('style');
			style.innerHTML = data;
			document.head.appendChild(style);
		}
	};

	var loadJS = function (data) {
		if (data) {
			var script = document.createElement('script');
			script.innerHTML = data;
			document.body.appendChild(script);
		}
	};

	var loadMarkdown = function (data) {
		if (!data) return;
		var script = document.createElement('script');
		script.src = 'https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js';
		script.onload = function () {
			var filename = url.split('/').pop();
			var baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
			var body = marked.parse(data);
			var tocbotBase = 'https://cdn.jsdelivr.net/npm/tocbot@4.25.0/dist/tocbot';
			var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><base href="' + baseUrl + '"><title>' + filename + '</title>' +
				'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css">' +
				'<style>' +
				'*,*::before,*::after{box-sizing:border-box}' +
				'html{scroll-behavior:smooth}' +
				'body{margin:0;display:flex;background:#fff;color:#1f2328;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
				'.markdown-body{background:#fff;color:#1f2328}' +
				'#toc-wrapper{display:none;flex-shrink:0;position:sticky;top:0;align-self:flex-start}' +
				'body.has-toc #toc-wrapper{display:block}' +
				'#toc-header{display:flex;align-items:center;gap:8px;padding:12px}' +
				'body.toc-open #toc-wrapper{width:260px;max-height:100vh;overflow-y:auto;border-right:1px solid #d0d7de;background:#fff}' +
				'body.toc-open #toc-header{padding:16px;border-bottom:1px solid #d0d7de}' +
				'#toc-toggle{background:#fff;border:1px solid #d0d7de;border-radius:6px;padding:5px 9px;cursor:pointer;font-size:15px;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,.1);flex-shrink:0}' +
				'#toc-toggle:hover{background:#f6f8fa}' +
				'#toc-label{display:none;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#57606a;font-weight:600}' +
				'body.toc-open #toc-label{display:block}' +
				'#toc-nav{display:none;padding:12px 16px;font-size:13px}' +
				'body.toc-open #toc-nav{display:block}' +
				'#toc-nav .toc-link{color:#57606a;text-decoration:none;display:block;padding:2px 4px;border-radius:4px}' +
				'#toc-nav .toc-link:hover,#toc-nav .is-active-link{color:#0969da;background:#f6f8fa}' +
				'#toc-nav .is-active-link{font-weight:600}' +
				'.toc-list{list-style:none;padding-left:12px;margin:4px 0}' +
				'#main{flex:1;min-width:0;padding:48px 64px 80px}' +
				'</style>' +
				'</head><body>' +
				'<aside id="toc-wrapper"><div id="toc-header"><button id="toc-toggle" aria-label="Toggle outline" aria-expanded="false" aria-controls="toc-nav">&#9776;</button><strong id="toc-label">Outline</strong></div><nav id="toc-nav"></nav></aside>' +
				'<main id="main"><article class="markdown-body">' + body + '</article></main>' +
				'<script>(function(){' +
				'var toggle=document.getElementById("toc-toggle");' +
				'var headings=document.querySelectorAll(".markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4");' +
				'var seen={};' +
				'headings.forEach(function(h){if(!h.id){var base=h.textContent.toLowerCase().replace(/[^\\w]+/g,"-").replace(/^-|-$/g,"");var id=base,n=1;while(seen[id]){id=base+"-"+(++n);}seen[id]=true;h.id=id;}});' +
				'if(headings.length>=3){' +
				'var link=document.createElement("link");link.rel="stylesheet";link.href="' + tocbotBase + '.css";document.head.appendChild(link);' +
				'var s=document.createElement("script");s.src="' + tocbotBase + '.min.js";' +
				's.onload=function(){tocbot.init({tocSelector:"#toc-nav",contentSelector:".markdown-body",headingSelector:"h1,h2,h3,h4",collapseDepth:3,scrollSmooth:true,orderedList:false});document.body.classList.add("has-toc");};' +
				'document.head.appendChild(s);' +
				'}' +
				'toggle.addEventListener("click",function(){var open=document.body.classList.toggle("toc-open");toggle.setAttribute("aria-expanded",open?"true":"false");});' +
				'})();<\/script>' +
				'</body></html>';
			setTimeout(function () {
				document.open();
				document.write(html);
				document.close();
			}, 10);
		};
		document.head.appendChild(script);
	};

	var fetchProxy = function (url, options, i) {
		var proxy = [
			'', // try without proxy first
			'https://api.codetabs.com/v1/proxy/?quest='
		];
		return fetch(proxy[i] + url, options).then(function (res) {
			if (!res.ok) throw new Error('Cannot load ' + url + ': ' + res.status + ' ' + res.statusText);
			return res.text();
		}).catch(function (error) {
			if (i === proxy.length - 1)
				throw error;
			return fetchProxy(url, options, i + 1);
		})
	};

	if (url && url.indexOf(location.hostname) < 0)
		fetchProxy(url, null, 0).then(isMarkdown(url) ? loadMarkdown : loadHTML).catch(function (error) {
			console.error(error);
			previewForm.style.display = 'block';
			previewForm.innerText = error;
		});
	else
		previewForm.style.display = 'block';

})()
