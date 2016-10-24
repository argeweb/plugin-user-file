#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Created with YooLiang Technology (侑良科技).
# Author: Qi-Liang Wen (温啓良）
# Web: http://www.yooliang.com/
# Date: 2015/7/12.

from google.appengine.ext import webapp
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext import blobstore
import urllib

plugins_helper = {
    "title": u"線上編輯原始碼",
    "desc": u"提供網站使用者進行檔案上傳",
    "controllers": {
        "user_file": {
            "group": u"檔案管理",
            "actions": [
                {"action": "list", "name": u"檔案管理"},
                {"action": "images_list", "name": u"圖片列表"},
                {"action": "add", "name": u"新增檔案管理"},
                {"action": "edit", "name": u"編輯檔案管理"},
                {"action": "view", "name": u"檢視檔案管理"},
                {"action": "delete", "name": u"刪除檔案管理"},
                {"action": "plugins_check", "name": u"啟用停用模組"},
            ]
        }
    }
}


class GetFileHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, source_blob_key):
        if self.request.headers.get('If-None-Match'):
                return self.error(304)

        blob_key = source_blob_key.split(".")[0]
        ext = source_blob_key.split(".")[1]
        if ext in ["jpg", "jpeg", "png", "gif"]:
            self.response.headers["Content-Transfer-Encoding"] = "base64"

        self.response.headers["Cache-Control"] = "public, max-age=604800"
        self.response.headers["ETag"] = source_blob_key

        #blob_key = str(urllib.unquote(source_blob_key))
        blob = blobstore.get(blob_key)
        if blob:
            self.response.headers['Content-Type'] = blob.content_type
            self.send_blob(blob, save_as=False)
        else:
            self.redirect("/not_found?path=/userfile/" + source_blob_key)

getfile_app = webapp.WSGIApplication([('/userfile/([^/]+)?', GetFileHandler)],debug=False)


class DownloadFileHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, source_blob_key):
        if self.request.headers.get('If-Modified-Since'):
            self.error(304)
            return
        if source_blob_key.find(".jpg"):
            self.response.headers['Content-Type'] = "image/jpg"
            self.response.headers["Content-Transfer-Encoding"] = "base64"
            source_blob_key = source_blob_key.replace(".jpg", "")

        blob_key = str(urllib.unquote(source_blob_key))
        self.response.headers["Cache-Control"] = "public, max-age=604800"
        if not blobstore.get(blob_key):
            self.redirect("/not_found?path=/download/" + source_blob_key)
        else:
            self.send_blob(blobstore.BlobInfo.get(blob_key), save_as=True)

download_app = webapp.WSGIApplication([('/download/([^/]+)?', DownloadFileHandler)],debug=False)
