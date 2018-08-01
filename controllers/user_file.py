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
from argeweb import route_menu, route
from google.appengine.ext import blobstore
from plugins.file.models.file_model import FileModel


class UserFile(argeweb.Controller):
    class Meta:
        Model = FileModel
        components = (scaffold.Scaffolding, Upload, Pagination, Search)
        pagination_actions = ('list', 'images_list',)
        upload_actions = ('add', 'add_from_ui', 'add_from_front_end')

    class Scaffold:
        display_in_list = ['name', 'content_type', 'content_length', 'path']

    @staticmethod
    def scaffold_after_apply(*args, **kwargs):
        item = kwargs['item']
        controller = kwargs['controller']
        path = controller.params.get_string('path', 'userfile/' + str(item.file) + '.' + item.name.split('.')[-1])
        if str(path).startswith('/'):
            path = path[1:]
        blob_item = blobstore.BlobInfo.get(item.file)
        item.file = blob_item.key()
        item.content_type = blob_item.content_type
        item.name = blob_item.filename
        try:
            item.title = blob_item.filename
        except Exception as e:
            import logging
            logging.debug(e)
        item.last_md5 = blob_item.md5_hash
        item.content_length = controller.params.get_integer(blob_item.size)
        item.path = path
        item.put()
        item.make_directory()
        controller.context['data'] = {
            'url': '/' + item.path,
            'item': item,
            'file_name': blob_item.filename
        }

    @route
    def get_url(self):
        self.meta.change_view('json')
        uri = self.params.get_string('uri', 'user_file:user_file:add_from_front_end')

        self.context['data'] = {
            'url': Upload.generate_upload_url(url=self.uri(uri)),
            'uri': uri
        }

    @route
    def add_from_front_end(self):
        self.meta.change_view('json')
        self.response.headers.setdefault('Access-Control-Allow-Origin', '*')
        self.events.scaffold_after_apply += self.scaffold_after_apply
        scaffold.add(self)
        return self.json(self.context['data'])

    @route
    def admin_get_url(self):
        self.meta.change_view('json')
        uri = self.params.get_string('uri', 'admin:user_file:user_file:add_from_ui')

        self.context['data'] = {
            'url': Upload.generate_upload_url(url=self.uri(uri))
        }

    @route
    @route_menu(list_name=u'system', group=u'檔案管理', text=u'圖片', sort=9701, icon='photo')
    def admin_images_list(self):
        def query_factory(controller):
            model = controller.Meta.Model
            return model.query(
                model.content_type.IN(['image/jpeg', 'image/jpg', 'image/png', 'image/gif'])).order(
                -model.content_type, -model.created, model._key)

        self.scaffold.query_factory = query_factory
        return scaffold.list(self)

    @route_menu(list_name=u'system', group=u'檔案管理', text=u'使用者檔案', sort=9702, icon='insert_drive_file')
    def admin_list(self):
        return scaffold.list(self)

    def admin_add(self):
        self.events.scaffold_after_apply += self.scaffold_after_apply
        return scaffold.add(self)

    @route
    def admin_add_from_ui(self):
        self.meta.change_view('json')
        self.events.scaffold_after_apply += self.scaffold_after_apply
        return scaffold.add(self)

    def admin_delete(self, key):
        return scaffold.delete(self, key)