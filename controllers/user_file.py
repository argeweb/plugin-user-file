#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Created with YooLiang Technology (侑良科技).
# Author: Qi-Liang Wen (温啓良）
# Web: http://www.yooliang.com/
# Date: 2015/7/12.

import argeweb
from argeweb import scaffold
from argeweb.components.pagination import Pagination
from argeweb.components.search import Search
from argeweb.components.upload import Upload
from argeweb import route_with, route_menu
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext import blobstore
from argeweb.core.scaffold import generate_upload_url
from plugins.file.models.file_model import FileModel


class UserFile(argeweb.Controller):
    class Meta:
        Model = FileModel
        components = (scaffold.Scaffolding, Upload, Pagination, Search)
        pagination_limit = 10
        pagination_actions = ("list", "images_list",)
        upload_actions = ("add", "add_from_ui")
        
    class Scaffold:
        display_properties_in_list = ("name", "content_type", "content_length", "path")

    @route_with('/admin/user_file/get.json')
    def admin_get_url(self):
        self.meta.change_view('json')
        uri = self.params.get_string("uri", 'admin:user_file:add_from_ui')
        self.context['data'] = {
            'url': generate_upload_url(self.uri(uri))
        }

    @route_menu(list_name=u"backend", text=u"圖片", sort=9700, icon="files-o", group=u"檔案管理")
    @route_with('/admin/user_file/images_list')
    def admin_images_list(self):
        self.meta.pagination_limit = 12
        model = self.meta.Model

        def photo_factory(self):
            return model.query(
                model.content_type.IN(["image/jpeg", "image/jpg", "image/png", "image/gif"])).order(
                -model.content_type, -model.created, model._key)
        self.scaffold.query_factory = photo_factory
        return scaffold.list(self)

    @route_menu(list_name=u"backend", text=u"使用者檔案", sort=9701, icon="files-o", group=u"檔案管理")
    def admin_list(self):
        return scaffold.list(self)

    @route_menu(list_name=u"backend", text=u"aaaaaa", sort=9711)
    def admin_add(self):
        def scaffold_after_apply(**kwargs):
            item = kwargs["item"]
            controller = kwargs["controller"]
            blob_key = blobstore.BlobInfo.get(item.file)
            item.content_type = blob_key.content_type
            item.name = blob_key.filename
            item.last_md5 = blob_key.md5_hash
            item.content_length = blob_key.size
            item.path = "userfile/" + str(item.file) + "." + item.name.split(".")[-1]
            item.put()
            item.make_directory()
            controller.context["data"] = {
                "url": item.path,
                "item": item
            }
        self.events.scaffold_after_apply += scaffold_after_apply
        return scaffold.add(self)

    @route_with('/admin/user_file/add_from_ui')
    def admin_add_from_ui(self):
        self.meta.change_view("json")
        def scaffold_after_apply(**kwargs):
            item = kwargs["item"]
            controller = kwargs["controller"]
            blob_key = blobstore.BlobInfo.get(item.file)
            item.content_type = blob_key.content_type
            item.name = blob_key.filename
            item.last_md5 = blob_key.md5_hash
            item.content_length = blob_key.size
            item.path = "userfile/" + str(item.file) + "." + item.name.split(".")[-1]
            item.put()
            item.make_directory()
            controller.context["data"] = {
                "url": item.path,
                "item": item
            }
        self.events.scaffold_after_apply += scaffold_after_apply
        return scaffold.add(self)

    def admin_delete(self, key):
        try:
            item = self.util.decode_key(key).get()
            blobstore.delete(item.resource_data)
        except:
            pass
        return scaffold.delete(self, key)