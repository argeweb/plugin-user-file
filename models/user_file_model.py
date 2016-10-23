#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Created with YooLiang Technology (侑良科技).
# Author: Qi-Liang Wen (温啓良）
# Web: http://www.yooliang.com/
# Date: 2015/7/12.

from argeweb import BasicModel
from argeweb import Fields


class UserFileModel(BasicModel):
    class Meta:
        label_name = {
            "filename": u"檔案名稱",
            "content_type": u"類型",
            "hash": u"hash",
            "size": u"大小",
            "file": u"檔案鍵值",
            "url": u"網址",
            "is_enable": u"顯示於前台",
        }
    filename = Fields.StringProperty()
    content_type = Fields.StringProperty()
    hash = Fields.StringProperty()
    size = Fields.IntegerProperty(default=0)
    file = Fields.BlobKeyProperty()
    url = Fields.StringProperty()


    @classmethod
    def all_by_created(cls):
        return cls.query().order(-cls.created)
