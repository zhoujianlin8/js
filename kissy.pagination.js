KISSY.add('pagination', function(S){
    function Pagination(opt) {
        this.opts = {
            container: '#page',
            totalPage: 20,      //�ܹ�����ҳ
            currentPage: 10,       //��ǰѡ��ҳ��
            bFirstLast: true,    //��ʼ����Ƿ���ʾ
            prevText:  '��һҳ',
            nextText: '��һҳ',
            firstText: '��ҳ',
            lastText: 'ĩҳ',
            ellipseText:"...",     //�����
            numOffset: 3,     //��ǰλ�����Ҽ��
            numSpacing: 2,       //���������β����ҳ
            callback: function(){return false} //���ҳǩ���غ���
        }
        if(S.isObject(opt)){
            this.opts = S.mix(this.opts,opt);
            if(S.isObject(this.opts.container)){
                this.con = this.opts.container;
            }else if(/^#/i.test(this.opts.container) || /^./i.test(this.opts.container)){
                this.con = S.one(this.opts.container);
            }else if(S.one("#"+this.opts.container)){
                this.con = S.one("#"+this.opts.container);
            }else {
                throw new Error('Pagination Container Hooker not found');
            }
            //ҳ����С��2 ��ִ��
            if((this.opts.totalPage - 0) <2){
                throw new Error('totalPage��������');
            }else{
                this.init();
            }
        }else{
            throw new Error('��������');
        }
    }
    S.augment(Pagination, {
        init: function() {
            this.renderUI();
            this.bindUI();
        },
        renderUI: function() {
            this._resetPagination();
        },
        bindUI: function() {
            var self = this;
            self.con.delegate('click','a',function(e){
                var currTaget = e.currentTarget;
                var $this = S.one(currTaget);
                var toPage = $this.attr('data-page') || 1;
                self.opts.currentPage = toPage-0;
                //���¸���
                self._resetPagination();
                self.opts.callback($this,toPage);
            })
        },

        _resetPagination: function() {
            var paginationInner = '',
                totalPage = this.opts.totalPage,
                currPage = (this.opts.currentPage <= totalPage && this.opts.currentPage) > 0 ? this.opts.currentPage : 1;
            this.opts.currentPage = currPage;
            //�������β
            if(this.opts.bFirstLast){
                paginationInner += currPage === 1 ? '<span class="pagination-first-disabled">'+this.opts.firstText+'</span><span class="pagination-start-disabled">'+this.opts.prevText+'</span>' : '<a class="pagination-first" data-page="1">'+this.opts.firstText+'</a><a class="pagination-prev" data-page="'+(currPage-1)+'">'+this.opts.prevText+'</a>';
                paginationInner += this._drawLink(totalPage,currPage);
                paginationInner += currPage === totalPage ? '<span class="pagination-next-disabled">'+this.opts.nextText+'</span><span class="pagination-last-disabled">'+this.opts.lastText+'</span>': '<a class="pagination-next" data-page="'+(currPage+1)+'">'+this.opts.nextText+'</a><a class="pagination-last" data-page="'+(totalPage)+'">'+this.opts.lastText+'</a>';

            }else{
                paginationInner += currPage === 1 ? '<span class="pagination-prev-disabled">'+this.opts.prevText+'</span>' : '<a class="pagination-prev" data-page="'+(currPage-1)+'">'+this.opts.prevText+'</a>';
                paginationInner += this._drawLink(totalPage,currPage);
                paginationInner += currPage === totalPage ? '<span class="pagination-next-disabled">'+this.opts.prevText+'</span>' : '<a class="pagination-last" data-page="'+totalPage+'">'+this.opts.prevText+'</a>';
            }
            this.con.html(paginationInner);
        },
        _drawLink: function(totalPage,currPage){
            var sLink = '';
            var numSpacing = this.opts.numSpacing;
            var numOffset = this.opts.numOffset;
            //ѡ��״̬֮ǰ
            if(currPage < numSpacing+numOffset){   //û�м��
                sLink += this._renderLink(1,currPage);
            }else{
                sLink += this._renderLink(1,numSpacing+1);
                sLink += this._renderEllipsePage();
                sLink += this._renderLink(currPage-numOffset,currPage);
            }
            //ѡ��״̬
            sLink += this._renderCurPage(currPage);
            //ѡ��״̬֮��
            if(currPage >= totalPage-numOffset-numSpacing){   //û�м��
                sLink += this._renderLink(currPage+1,totalPage+1);
            }else{
                sLink += this._renderLink(currPage+1,currPage+numOffset+1);
                sLink += this._renderEllipsePage();
                sLink += this._renderLink(totalPage-numSpacing+1,totalPage+1);
            }
            return sLink;
        },
        _renderLink: function(start,end){
            var str = '';
            for(var i= start; i< end; i++){
                str += this._renderActivePage(i);
            }
            return str;
        },
        _renderEllipsePage: function(){
            return '<span class="pagination-ellipse">' + this.opts.ellipseText+ '</span>';
        },
        _renderActivePage: function(index) {
            return '<a class="pagination-item" data-page="' + index + '">' + index + '</a>';
        },
        _renderCurPage: function(index){
            return '<span class="pagination-item-disabled">' + index + '</span>';
        },
        show: function() {
            this.con.show();
        },
        hide: function() {
            this.con.hide();
        }
    });

    return Pagination;

},{
    requires:[]
});