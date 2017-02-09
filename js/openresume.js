/*
 *	OPEN RESUME
 *	Copyright 2010-2017 Luke Nickerson
 *
 * TO DO: 
 * - convert all & characters to & codes
 * - make style responsive
 *
 */

var openResume = (function(){

	if (typeof $ === "undefined") { console.error("ERROR: jQuery ($) is required but is not found"); }

	function getUrlVars() {
		var map = {};
		var parts = window.location.search.replace(/[?&]+([^=&]+)(=[^&]*)?/gi, function(m,key,value) { map[key] = (value === undefined) ? true : value.substring(1); }); 
		return map; 
	}

	$(document).ready(function(){
		$.fn.fadeInSlideDown = function(speed){
			this.css("opacity", 0).slideDown(speed).animate(
				{ opacity: 1 }
				,{ queue: false, duration: speed }
			);
		}
	});


	function OpenResumeClass (cvId) 
	{
		this.cvId = cvId;
		this.$destination = $('#resume').addClass("resume");
		this.$footer = $('#pagefooter');
		this.dataDirectory = "data/";
		this.resumeData = {};
		this.loadingHtml = '<img src="images/ajax-loader.gif" />Loading...';
		this.showContactInfo = true;
		
		this.setupDocument = function ()
		{
			if (this.$destination.length == 0) 	this.$destination = $('<div id="resume" class="resume"></div>').appendTo('body');
			if (this.$footer.length == 0) 		this.$footer = $('<div id="pagefooter"></div>').appendTo('body');
			var $dest = this.$destination;
			$dest.html(this.loadingHtml);
			$dest.ajaxError( function(e, xhr, ajaxOptions, thrownError) {
				console.error("Ajax Error");
				console.log(e);
				console.log(xhr);
				console.log(ajaxOptions);
				console.log(thrownError);
				$dest.slideDown("fast").html("Ajax Error<br>" + ajaxOptions.url + "<br>" + xhr.status + "<br>" + xhr.responseText);
			});		
		}
		
		this.load = function () 
		{
			
			var urlVars = getUrlVars();
			if (urlVars["cv"]) {
				this.cvId = urlVars["cv"];
			}
			if (urlVars["sci"]) {
				
				this.showContactInfo = (parseInt(urlVars["sci"])) ? true : false;
			}		
			if (typeof this.cvId !== "string" || this.cvId == "") {
				this.$destination.html('Error: No "cv" parameter specified.');
			} else {
				var jsonUrl = this.dataDirectory + "openresume_data_" + this.cvId + ".json";
				console.log("Loading data from " + jsonUrl);
				var o = this;
				$.getJSON(jsonUrl, function (resumeObj) {
					// *** TO DO: do some checks on the resumeObj to make sure it's 'valid' for resume data
					console.log(resumeObj);
					this.resumeData = resumeObj;
					o.writeResume(resumeObj);
					
					document.title = resumeObj.name + "'s Resume";
					$('#pagefooter').html('<div class="web"><a href="'+jsonUrl+'">This resume is also available in JSON format.</a><br />Design and Coding &copy; 2010-2017 Luke Nickerson</div><div class="print">This resume is available online in HTML and JSON formats at '+window.location.href + '</div>');
				});
			}
		}

		this.writeResume = function (resume)
		{
			var i, h = "";
			//var resume = this.resumeData;
			console.log(resume);
			h += '<div class="header"><h1>'+resume.name+'</h1>'
				+ '<div class="contact">';
				
			if (this.showContactInfo) {
				h += '<h2>Contact Information</h2><ul>'
					+ '<li><label>email:</label> ';
				for (i = 0; i < resume.email.length; i++) {
					if (i>0) h += " | ";
					h += '<a href="mailto:'+resume.email[i]+'">' + resume.email[i] + '</a>';
				}
				h += '</li>';
				if (typeof resume.phone !== 'undefined') {
					h += '<li><label>phone:</label> ';
					for (i = 0; i < resume.phone.length; i++) {
						if (i>0) h += " | ";
						h += '<a href="tel:' + resume.phone[i] + '">' + resume.phone[i] + '</a>';
					}
					h += '</li>';
				}
				if (typeof resume.links === 'object') {
					$.each(resume.links, function(i, link){
						for (prop in link) {
							h += (
								'<li>'
								+ '<a href="' + link[prop] + '">' + prop + ': ' + '<span class="url">' + link[prop] + '</span></a>'
								+ '</li>'
							);
						}
					});
				}

				h += '</ul>';
			}
			h += '</div><br></div>';
			
			for (i = 0; i < resume.order.length; i++) {
				// TODO: Add this back in
				if (resume.order[i] !== 'skills') {
				h = h + '<div class="section '+resume.order[i]+'"><h2>' + resume.headers[i] + '</h2>'
					+ this.getSectionHtml(resume.order[i], resume)
					+ '<br />'
					+ '</div>';
				}
			}	
			
			h += '<div class="footnote">'+resume.footnote+'</div>';
			
			var $dest = this.$destination;
			var $foot = this.$footer.fadeOut(100);
			$dest.slideUp(500,function(){
				$dest.html(h).fadeInSlideDown(1750);
				$foot.fadeInSlideDown(1750);
			});
		}

		this.getSectionHtml = function (sectionName, rObj) 
		{
			console.log('Getting section html for ', sectionName);
			var h = "";
			switch (sectionName) {
				case "summary":
					h += rObj.summary;
					break;
				case "experience":
					for (i = 0; i < rObj.experience.length; i++) {
						var xp = rObj.experience[i];
						h += '<h3>' + xp.company + '</h3>';
						h += '<ul>';
						h += '<li class="description">' + xp.description + '</li>';
						if (typeof xp.title === 'string') {
							h += '<li class="title">' + xp.title + '</li>';
						}
						if (typeof xp.startdate === 'string' && typeof xp.enddate === 'string') {
							h += '<li class="dates">' + xp.startdate + ' - ' + xp.enddate + '</li>';
						}
						if (typeof xp.bullets === 'object') {
							h += '<li><ul class="xpBulletList">';
							for (z = 0; z < xp.bullets.length; z++) {
								h += '<li>' + xp.bullets[z] + '</li>';
							}
							h += '</ul></li>';
						}
						h += '</ul>';
					}
					break;
				case "skills":
					var category = "";
					var catCount = 0;
					for (i = 0; i < rObj.skills.length; i++) {
						if (category != rObj.skills[i].category) {
							catCount++;
							if (catCount > 1) h += '</ul>';
							category = rObj.skills[i].category;
							h += '<h3>' + category + '</h3><ul>';
						}
						h += '<li><label>' + rObj.skills[i].name + '</label>';
						h += this.getBarHtml(rObj.skills[i].proficiency, 100);
						h += '</li>';
					}
					h += '</ul>';
					break;
				case "education":
					for (i = 0; i < rObj.education.length; i++) {
						var edu = rObj.education[i];
						h += '<h3>' + edu.school + '</h3>';
						h += '<ul>';
						h += '<li class="location">';
						h += '<span class="sep">, </span>';
						h += '<span class="location">' + edu.location + '</span></li>';
						if (edu.note) h += '<li class="note">' + edu.note + '</li>';
						h += '<li class="degree-major-date">';
						h += '<span class="degree">' + edu.degree + '</span><span class="sep">, </span>';
						h += '<span class="major">' + edu.major + '</span><span class="sep">, </span>';
						h += '<span class="degreedate">' + edu.degreedate + '</span>';
						h += '</li>';
						h += '<li class="minors">' + edu.minor + '</li>';
						h += '</ul>';
					}
					break;
				case "references":
					for (i = 0; i < rObj.references.length; i++) {
						var ref = rObj.references[i];
						h += '<h3>' + ref.name + '</h3>';
						h += '<ul>';
						h += '<li class="titlecompany">' + ref.title + ', ' + ref.company +  '</li>';
						h += '<li class="connection">' + ref.connection +  '</li>';
						h += '<li class="email"><label>email: </label>';
						for (z = 0; z < ref.email.length; z++) {
							if (z > 0) h += " | ";
							h += '<a href="mailto:' + ref.email[z] + '">'+ ref.email[z] + '</a>';
						}
						h += '</li>';
						h += '<li class="phone"><label>phone: </label>';
						for (z = 0; z < ref.phone.length; z++) {
							if (z > 0) h += " | ";
							h += ref.phone[z];
						}
						h += '</li>';
						h += '</ul>';
					}
					break;
			}
			return h;
		}	
		
		this.getBarHtml = function (val, maxWidth) 	// val = 0-10, maxWidth = width in pixels
		{
			var b = '<div class="barout" style="width: '+ maxWidth + 'px;">';
			b += '<div class="barin" style="width: ' + (val/10)*maxWidth + 'px;">' + val + '</div>';
			b += '</div>';
			return b;
		}

		
		//========= Construction
		this.setupDocument();
		//this.load();

	}

	return {
		resume: null,
		load: function(n) {
			this.resume = new OpenResumeClass(n);
			this.resume.load();
		}
	}

})();


