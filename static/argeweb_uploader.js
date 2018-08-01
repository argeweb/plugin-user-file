// Image Upload for Google App Engine
// 圖片上傳至 GAE
// Version 1.01 (2018/06/05)
// @requires jQuery v2 or later
// Copyright (c) 2018 Qi-Liang Wen 啟良
const uploader = {
    "pickup_target": null,
    "pickup_target_is_editor": false,
    "visual_timer": 3,
    "pickup": function ($target, ed) {
        uploader.pickup_target = $target;
        uploader.pickup_target_is_editor = ed;
        if (ed !== true) {
            if ($target.hasClass("image")) {
                $("#argeweb-file-uploader").attr("accept", "image/*");
            } else {
                $("#argeweb-file-uploader").attr("accept", "*");
            }
        }
        $("#argeweb-file-uploader").click();
    },
    "startUpload": function () {
        let fileInput = document.getElementById('argeweb-file-uploader');
        let file = fileInput.files[0];
        if (uploader.pickup_target_is_editor) {
            uploader.addFile(file, uploader.pickup_target.id, uploader.setEditorValue);
        } else {
            let randId = uploader.getRandID("upload-");
            uploader.pickup_target.attr("data-uploadId", randId);
            uploader.addFile(file, randId, uploader.setTargetValue);
        }
    },
    "addFile": function (file, target_id, callback) {
        uploader.progress_bar.set(10);
        let message_id = uploader.message.insert("info", "準備上傳", "等待中....", undefined, true);
        json_async("/user_file/user_file/get_url", null, function (data) {
            uploader.progress_bar.set(20);
            uploader.upload({
                "message_id": message_id,
                "upload_url": data["url"],
                "file": file,
                "target_id": target_id,
                "callback": callback
            });
        }, function (data) {
            uploader.progress_bar.set(0);
            uploader.message.change(message_id, "danger", "發生錯誤", "無法取得上傳的路徑，請稍候再試一次");
        });
    },
    "upload": function (upload_target) {
        let reader = new FileReader();
        reader.reader_info = upload_target;
        try {
            reader.readAsDataURL(upload_target.file);
        } catch (e) {
            uploader.progress_bar.set(0);
            return false;
        }
        reader.onload = function (e) {
            this.reader_info.image = this.result;
            uploader.progress_bar.set(30);
            uploader.message.change(this.reader_info.message_id, "info", "正在上傳", "等待中....", this.reader_info.image, true);
            let fd = new FormData();
            let xhr = new XMLHttpRequest();
            xhr.xhr_info = this.reader_info;
            xhr.upload.upload_info = this.reader_info;
            xhr.open('POST', this.reader_info.upload_url);
            xhr.onload = function (data) {
                uploader.progress_bar.set(100);
                uploader.message.change(this.xhr_info.message_id, "success", "上傳完成", "100 %, 上傳完成", this.xhr_info.image, true);
                let s = data.currentTarget.responseText;
                let callback_data = {};
                try{
                    callback_data = JSON.parse(s);
                    callback_data["target_id"] = this.xhr_info.target_id
                }catch (e){
                    let sn = s.indexOf('"data": {"url": "') + '"data": {"url": "'.length;
                    let se = s.indexOf('", "item": ');
                    let url = s.substring(sn, se);
                    callback_data = {
                        "url": url,
                        "target_id": this.xhr_info.target_id
                    };
                }
                this.xhr_info.callback(callback_data);
            };
            xhr.onerror = function (e) {
                uploader.message.change(this.xhr_info.message_id, "danger", "上傳失敗", "請重整頁面後再試一次", this.xhr_info.image, true);
                uploader.progress_bar.set(0);
            };
            xhr.upload.onprogress = function (evt) {
                if (evt.lengthComputable) {
                    let complete = (evt.loaded / evt.total * 100 | 0);
                    if (100 === complete) {
                        complete = 99.9;
                    }
                    let the_xhr = this;
                    setTimeout(function () {
                        uploader.message.change(the_xhr.upload_info.message_id, "info", "正在上傳", complete + ' %', the_xhr.upload_info.image, true);
                    }, 0);
                    uploader.progress_bar.set(complete);
                }
            };
            fd.append('name', this.reader_info.file.name);
            fd.append('content_type', this.reader_info.file.type);
            fd.append('content_length', this.reader_info.file.size);
            fd.append('file', this.reader_info.file);
            xhr.send(fd);//開始上傳
        };
        if (/image\/\w+/.test(upload_target.file.type)) {
        }
    },
    "onDragStart": function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        let dt = evt.dataTransfer;
        if (dt.types && (dt.types.indexOf ? dt.types.indexOf('Files') != -1 : dt.types.contains('Files'))) {
            $("html").addClass("dropping");
            if ($(".file-picker-div, .imgs-selector-div, .field-type-rich-text-field").length == 0) {
                $("#dropping").addClass("no_target");
            } else {
                $("#dropping").removeClass("no_target");
                $(".file-picker-div, .imgs-selector-div").parent().parent().addClass("dropping-box");
            }
        }
    },
    "onDragEnd": function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        uploader.visual_timer = 0;
        setTimeout(uploader.removeVisualClass, 1000);
    },
    "onDragOver": function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        uploader.visual_timer = 3;
        $("html").addClass("dropping");
        $(".file-picker-div, .imgs-selector-div").parent().parent().addClass("dropping-box");
    },
    "removeVisualClass": function () {
        if (uploader.visual_timer == 0) {
            $("html").removeClass("dropping");
            $(".file-picker-div, .imgs-selector-div").parent().parent().removeClass("dropping-box");
            uploader.visual_timer = 0;
        } else {
            uploader.visual_timer--;
            setTimeout(uploader.removeVisualClass, 1000);
        }
    },
    "onDrop": function (evt) {
        let files = evt.dataTransfer.files;
        evt.preventDefault();
        uploader.visual_timer = 0;
        $("html").removeClass("dropping");
        $(".file-picker-div, .imgs-selector-div").parent().parent().removeClass("dropping-box");
        if (files.length > 10) {
            uploader.message.insert("danger", "錯誤", "一次可上傳 10個文件", undefined);
            return;
        }
        for (let i = 0; i < files.length; i++) {
            let t = evt.target;
            let randId = uploader.getRandID("upload-");
            if ($(t).hasClass("form-group")) {
                $(t).attr("data-uploadId", randId);
            } else {
                $(t).parents(".form-group").attr("data-uploadId", randId);
            }
            if ($(t).hasClass("mce-content-body") || $(t).parents("body").hasClass('mce-content-body ')) {
                randId = $(t).parents("body").data("id") || $(t).data("id");
                uploader.addFile(files[i], randId, uploader.setEditorValue);
            } else {
                uploader.addFile(files[i], randId, uploader.setTargetValue);
            }
        }
    },
    "setTargetValue": function (data) {
        let url = data.url;
        let target_id = data.target_id;
        let item_key = "";
        try{
            item_key = data.item.__key__;
        }catch (e){
        }
        try{
            uploader.message.change(0, "success", "上傳完成", url , "", true);
            uploader.message.change(0, "success", "上傳完成", target_id , "", true);
            let t = $("*[data-uploadId='" + target_id + "']");
            t.val(url).data("key", item_key).change().show();
        }catch (e){
            uploader.message.change(0, "success", "上傳完成", e.toString() , "", true);
        }
        try{
            if (typeof after_argeweb_upload){
                after_argeweb_upload(data)
            }
        }catch (e){
        }
    },
    "setEditorValue": function (data) {
        let url = data.url;
        let target_id = data.target_id;
        if (typeof data.response.data !== "undefined") {
            data = data.response.data;
            url = data.url;
        }
        if (tinyMCE.get(target_id)) {
            tinyMCE.get(target_id).selection.setContent('<img src="' + url + '" />');
        }
    },
    "message": {
        "dom": "#argeweb_uploader_message",
        "insert": function (e, s, t, r) {
            console.log(e, s, t, r);
            $(uploader.message.dom).append(r);
        },
        "change": function (e, s, t, r) {
            console.log(e, s, t, r);
            $(uploader.message.dom).append(r);
        }
    },
    "progress_bar": {
        "set": function (n) {
            setTimeout(function () {
                $(".argeweb-progress-bar").width(n + "%");
            }, 0);
            if (n === 100) {
                setTimeout(function () {
                    $(".argeweb-progress-bar").width(0);
                }, 2500);
            }
        }
    },
    "getRandID": function (a) {
        if (a === undefined) {
            a = "rand-id-"
        }
        let b = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 5; i++) a += b.charAt(Math.floor(Math.random() * b.length));
        return a
    },
    "ctrlIsPressed": false,
};
//  初始化
$(function () {
    $(document)
        .on("click", ".file-picker", function (e) {
            uploader.pickup($(this).parents(".input-group").find("input"), false);
            e.preventDefault();
            e.stopPropagation();
        }).on("change", ".file-picker-div input", function () {
        let val = $(this).val();
        let is_image = $(this).parents(".form-group").hasClass("form-group-avatar") ||
            $(this).parents(".form-group").find("input").hasClass("image");
        if (is_image) {
            $(this).parents(".form-group").find(".file-picker-item").css("background-image", "url(" + val + ")").text("");
        } else {
            $(this).parents(".form-group").find(".file-picker-item").attr("data-ext", val.split(".")[1]).text(val.split(".")[1]);
        }
    });

});
(function ($) {
    $.fn.uploader = function (options) {
        let opts = $.extend({}, $.fn.uploader.defaults, options);
        return this.each(function () {
            let obj = $(this);
            obj
                .on("touchstart", function (e) {
                    uploader.pickup(obj, false);
                })
                .on("click", function (e) {
                    if (obj.val() === "" || uploader.ctrlIsPressed)
                        uploader.pickup(obj, false);
                    e.preventDefault();
                    e.stopPropagation();
                })
                .on("change", function () {
                    let s = "點擊此處上傳檔案";
                    if (obj.val()) s = "按住 Ctrl 後，點擊此處來重新上傳檔案";
                    obj.attr("placeholder", s).attr("title", s);
                    opts.onchange(obj.val());
                }).change();

        });
    };
    $.fn.uploader.defaults = {
        "onchange": function (val) {
            console.log(val);
        }
    };
}(jQuery));

function json_async_for_uploader(url, data, successCallback, errorCallback) {
    $.ajax({
        url: url, type: "POST", cache: false, dataType: "json", data: data, async: 1, success: function (a) {
            successCallback(a)
        }, error: function (b, c, e) {
            let d = JSON.parse(b.responseText);
            void 0 === errorCallback ? alert(d.message) : errorCallback(d)
        }
    })
}

$(function () {
    $(".argeweb-file-uploader").uploader();
    $(document).keydown(function (event) {
        if (event.which === 17)
            uploader.ctrlIsPressed = true;
    });
    $(document).keyup(function () {
        uploader.ctrlIsPressed = false;
    });
    if (typeof json_async !== 'function'){
        window['json_async'] = json_async_for_uploader;
    }
    if ($("#argeweb-file-uploader").length === 0) {
        $("head").append('<style>' +
            '.argeweb-file-uploader-progress {position: fixed;background: transparent;top: 0;width: 100%;height: 4px;z-index: 999;margin: 0;}' +
            '.argeweb-progress-bar {background-color: #222;height: 4px;width:0}</style>'
        );
        $("body").append(
            '<div class="argeweb-file-uploader-progress"><div class="argeweb-progress-bar"></div></div>' +
            '<div style="display: none;"><form id="file-form"><input type="file" id="argeweb-file-uploader" accept="image/*" /></form></div>');
        $(document).on('change', '#argeweb-file-uploader', uploader.startUpload);
    }
});