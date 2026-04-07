jQuery(function() {
	var modalConfirm = function(callback) {
		$("input#btn-submit").click(function(e) {
			e.preventDefault();
			var i = [];
			var	phonetic = $('input[name="02"]:text').val();
			var	guests = $('input[name="05"]').val();
			var	date = $('select[name="04"]').val();
			var	inquiry = $('textarea[name="06"]').val();
			$('input[required]').each(function() {
				i.push($(this).val());
				var name = $(this).val();	

			});

			// console.log(i); viw the array
			if (!i.includes("")) {
				$("#mi-modal").modal('show');
				$(".name").html('<p class="info">'+i[0]+'</p>');
				$(".phone").html('<p class="info">'+i[1]+'</p>');
				$(".email").html('<p class="info">'+i[2]+'</p>');
				$(".phonetic").html('<p class="info">'+phonetic+'</p>');
				$(".date").html('<p class="info">'+date+'</p>');
				$(".guests").html('<p class="info">'+guests+'</p>');
				$(".inquiry").html('<p class="info breakers">'+inquiry+'</p>');
			}
			$("span.alterting").remove();
			$("input").css('border', 'solid 1px #f2e9e4');
			$("span.alterting").css('color', 'red');
			if(i[0] ==""){
				$("input[name='01']").css('border', 'solid 1px #f38383');
				$("input[name='01']").after('<span class="alterting"><i>Fill Up Name Is Required</i></span>');
				$("span.alterting").css('color', 'red');

			}else if(i[1] ==""){
				$("input[name='06']").css('border', 'solid 1px #f38383');
				$("input[name='06']").after('<span class="alterting"><i>Fill Up Number Is Required</i></span>');
				$("span.alterting").css('color', 'red');

			}else if(i[2] ==""){
				$("input[name='03']").css('border', 'solid 1px #f38383');
				$("input[name='03']").after('<span class="alterting"><i>Fill Up Email Is Required</i></span>');
				$("span.alterting").css('color', 'red');
			}
		});
		$("#modal-btn-yes").on("click", function() {
			callback(true);
			$("#mi-modal").modal('hide');
			$('form').submit();
		});
		$("#modal-btn-no").on("click", function() {
			callback(false);
			$("#mi-modal").modal('hide');
			});
		};
	modalConfirm(function(confirm) {
		if (confirm) {			
			$("#result").html("Nice ka oNe");
		} else {		
			$("#result").html("Tell next time");
		}
	});
});
$(function() {
		var i = 1;
		$('#slideMenuBtn').click(function() {
			if (i == 1) {
				$('#slideMenuBtn img').attr('src', $('#slideMenuBtn img').attr('src').replace('_no', '_on'));
				var w = $(window).width();
				if (w <= 480) {
					$('#slideMenu').animate({
					'left': '15%'
					}, 400);
				} else if (w <= 768) {
					$('#slideMenu').animate({
					'left': '60%'
					}, 400);
				} else {
					$('#slideMenu').animate({
					'left': '80%'
					}, 400);
				}
				i = 2;
			} else if (i != 1) {
				$('#slideMenuBtn img').attr('src', $('#slideMenuBtn img').attr('src').replace('_on', '_no'));
				$('#slideMenu').animate({
				'left': '100%'
				}, 200);
				i = 1;
			}
		});
		$('#slideMenu a').click(function() {
			$('#slideMenuBtn img').attr('src', $('#slideMenuBtn img').attr('src').replace('_on', '_no'));
			$('#slideMenu').animate({
				'left': '100%'
				}, 200);
			i = 1;
		});
	});
$(function() {
	$('#gotop').hide();
	$(window).scroll(function() {
		$('#pos').text($(this).scrollTop());
		if ($(this).scrollTop() > 240) {
			$('#gotop').fadeIn();
		} else {
			$('#gotop').fadeOut();
		}
	});
});
$(function(){
	$('#gotop').click(function() {
		$('body').animate({
			scrollTop:0
		}, 300);
		return false;
	});
});

$(document).ready(function() {
	$(".blog1").hover(function() {
		$(this).animate({opacity: "0.6"}, "1000");
		}, function() {
		$(this).animate({opacity: "1.0"}, "1000");
	});
});

$(window).load(function() {
	$("#loading").fadeOut();
});

$(function() {
	$('a[href^=#]').click(function(){
		var speed = 400;
		var href= $(this).attr("href");
		var target = $(href == "#" || href == "" ? 'html' : href);
		var position = target.offset().top;
		$("html, body").animate({scrollTop:position}, speed, "swing");
		return false;
	});
});

$(window).on('load resize', function() {
	var arr = [
		".sHeight" 
		];

	$.each(arr, function(i, value) {
		var x = 0;
			$(value).css({
			'height': 'auto'
		});
		$(value).each(function() {
		if ($(this).height() > x) {
			x = $(this).height();
			}
		});
		$(value).height(x);
		x = 0; // reset
	});
});

$(window).on('load resize', function() {
	var arr = [
		".sHeight2" 
		];

	$.each(arr, function(i, value) {
		var x = 0;
			$(value).css({
			'height': 'auto'
		});
		$(value).each(function() {
		if ($(this).height() > x) {
			x = $(this).height();
			}
		});
		$(value).height(x);
		x = 0; // reset
	});
});

$(window).on('load resize', function() {
	var arr = [
		".menu-explain" 
		];

	$.each(arr, function(i, value) {
		var x = 0;
			$(value).css({
			'height': 'auto'
		});
		$(value).each(function() {
		if ($(this).height() > x) {
			x = $(this).height();
			}
		});
		$(value).height(x);
		x = 0; // reset
	});
});

$(function(){
	var $setElm = $('.blog1 .b1');
	var cutFigure = '64'; 
	var afterTxt = '…'; 

	$setElm.each(function(){
		var textLength = $(this).text().length;
		var textTrim = $(this).text().substr(0,(cutFigure))

		if(cutFigure < textLength) {
			$(this).html(textTrim + afterTxt).css({visibility:'visible'});
		} else if(cutFigure >= textLength) {
			$(this).css({visibility:'visible'});
		}
	});
});

$(function(){
	var $setElm = $('.blog1 .b2');
	var cutFigure = '65'; 
	var afterTxt = '…'; 

	$setElm.each(function(){
		var textLength = $(this).text().length;
		var textTrim = $(this).text().substr(0,(cutFigure))

		if(cutFigure < textLength) {
			$(this).html(textTrim + afterTxt).css({visibility:'visible'});
		} else if(cutFigure >= textLength) {
			$(this).css({visibility:'visible'});
		}
	});
});

$(function(){
	var $setElm = $('.blog1 .b3');
	var cutFigure = '60'; 
	var afterTxt = '…'; 

	$setElm.each(function(){
		var textLength = $(this).text().length;
		var textTrim = $(this).text().substr(0,(cutFigure))

		if(cutFigure < textLength) {
			$(this).html(textTrim + afterTxt).css({visibility:'visible'});
		} else if(cutFigure >= textLength) {
			$(this).css({visibility:'visible'});
		}
	});
});

$(function(){
	var $setElm = $('.blog1 .b4');
	var cutFigure = '66'; 
	var afterTxt = '…'; 

	$setElm.each(function(){
		var textLength = $(this).text().length;
		var textTrim = $(this).text().substr(0,(cutFigure))

		if(cutFigure < textLength) {
			$(this).html(textTrim + afterTxt).css({visibility:'visible'});
		} else if(cutFigure >= textLength) {
			$(this).css({visibility:'visible'});
		}
	});
});

$(function(){
	var $setElm = $('.blog1 .b5');
	var cutFigure = '77'; 
	var afterTxt = '…'; 

	$setElm.each(function(){
		var textLength = $(this).text().length;
		var textTrim = $(this).text().substr(0,(cutFigure))

		if(cutFigure < textLength) {
			$(this).html(textTrim + afterTxt).css({visibility:'visible'});
		} else if(cutFigure >= textLength) {
			$(this).css({visibility:'visible'});
		}
	});
});

$(function(){
	var $setElm = $('.blog1 .b6');
	var cutFigure = '65'; 
	var afterTxt = '…'; 
	
	$setElm.each(function(){
		var textLength = $(this).text().length;
		var textTrim = $(this).text().substr(0,(cutFigure))

		if(cutFigure < textLength) {
			$(this).html(textTrim + afterTxt).css({visibility:'visible'});
		} else if(cutFigure >= textLength) {
			$(this).css({visibility:'visible'});
		}
	});
});