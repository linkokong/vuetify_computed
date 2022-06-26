<template>
  <v-container>
    <v-row class="text-center">
      <v-col cols="12">
        <v-form v-model="valid" :disabled="form_disabled" ref="form">
          <v-container>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="range"
                  type="number"
                  :rules="rangeRules"
                  label="计算范围"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-radio-group v-model="range_type" row mandatory>
                  <v-radio label="按计算结果" value="1"></v-radio>
                  <v-radio label="按计算数值" value="2"></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="question_count"
                  type="number"
                  :rules="questionCountRules"
                  label="题目数"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="3" md="2">
                <v-checkbox
                  v-model="computed_type"
                  :rules="computedTypeRules"
                  label="加法"
                  value="add"
                  color="red"
                ></v-checkbox>
              </v-col>
              <v-col cols="3" md="2">
                <v-checkbox
                  v-model="computed_type"
                  :rules="computedTypeRules"
                  label="减法"
                  value="sub"
                  color="indigo"
                ></v-checkbox>
              </v-col>
              <v-col cols="3" md="2">
                <v-checkbox
                  v-model="computed_type"
                  :rules="computedTypeRules"
                  label="乘法"
                  value="multi"
                  color="orange"
                ></v-checkbox>
              </v-col>
              <v-col cols="3" md="2">
                <v-checkbox
                  v-model="computed_type"
                  :rules="computedTypeRules"
                  label="除法"
                  value="div"
                  color="primary"
                ></v-checkbox>
              </v-col>
            </v-row>
            <v-row>
              <v-btn
                color="success"
                class="mr-4"
                @click="generateQuestion"
                :disabled="examination"
              >
                生成考题
              </v-btn>
              <v-btn
                color="primary"
                class="mr-4"
                @click="start"
                :disabled="examination || question_list == 0"
              >
                开始答题
              </v-btn>
              <v-btn
                  color="error"
                  class="mr-4"
                  @click="print"
                  :disabled="question_list == 0"
              >
                打印题目
              </v-btn>
            </v-row>
          </v-container>
        </v-form>
      </v-col>
    </v-row>
    <form
      style="border: thin solid rgba(0,0,0,.12);min-height: 498px;margin-top:20px;padding:20px 5px"
      id="form-content"
      ref='print_area'
    >
      <v-banner>
        <span v-if="examination">已用时间:{{ formatSeconds(used_time) }}
          </span>
      </v-banner>
      <v-row>
        <v-col
          v-for="(item, index) in question_list"
          :key="index"
          cols="12"
          sm="12"
          md="6"
        >
          <v-row dense class='item-row'>
            <v-col cols="5" sm="5" md="3">
              <v-subheader
                ><v-row
                  ><span>{{ item.left }}</span
                  ><v-icon>{{ symbol_map[item.symbol] }}</v-icon
                  ><span>{{ item.right }}</span></v-row
                ></v-subheader
              >
            </v-col>
            <v-col cols="2" sm="2" md="2">
              <v-subheader> <v-icon>mdi-equal</v-icon> </v-subheader>
            </v-col>
            <v-col cols="5" sm="5" md="3">
              <v-text-field
                v-model="item.computed_res"
                type="number"
                dense
                solo
                :error="item.submit && !item.res"
                :error-messages="item.submit && !item.res ? '错误' : ''"
                :disabled="!examination"
              >
                <v-icon
                  v-if="!item.submit"
                  @click="sendMessage(item, index)"
                  slot="append-outer"
                  color="blue"
                >
                  mdi-send
                </v-icon>
                <v-icon
                  v-else-if="item.submit && item.res"
                  slot="append-outer"
                  color="green"
                >
                  mdi-check-bold
                </v-icon>
                <v-icon
                  v-else-if="item.submit && !item.res"
                  @click="sendMessage(item, index)"
                  slot="append-outer"
                  color="red"
                >
                  mdi-close
                </v-icon>
              </v-text-field>
            </v-col>
          </v-row>
        </v-col>

      </v-row>
    </form>
    <v-container>
        <v-col>
          <v-row>
              <v-btn
                color="primary"
                class="mr-4"
                @click="pause"
                :disabled="!examination"
              >
                暂停
              </v-btn>
              <v-btn
                color="primary"
                class="mr-4"
                @click="submitQuestion"
                :disabled="!examination"
              >
                交卷
              </v-btn>
              <span v-if="finished"> 得分：{{ this.score }} 分。 已用时间:{{ formatSeconds(used_time) }}
              </span>
            </v-row>
        </v-col>
        </v-container>

    <v-overlay :value="paused">
      <v-btn color="success" @click="restart">
        继续考试
      </v-btn>
    </v-overlay>
  </v-container>
</template>

<script>
import printJS from 'print-js'
import html2canvas from 'html2canvas'
export default {
  name: "HelloWorld",

  data: () => ({
    symbol_map: {
      multi: "mdi-close",
      add: "mdi-plus",
      div: "mdi-division",
      sub: "mdi-minus"
    },
    valid: false,
    form_disabled: false,
    range: 10,
    range_type: 1,
    computed_type: [],
    random_computed_map: {
      add: "generateAdd",
      sub: "generateSub",
      multi: "generateMulti",
      div: "generateDiv"
    },
    question_count: 10,

    rangeRules: [
      v => !!v || "必须设定计算范围",
      v => (v <= 9999 && v >= 10) || "10~9999之间"
    ],
    questionCountRules: [
      v => !!v || "必须设定题目数量",
      v => (v <= 999 && v >= 10) || "10~999之间"
    ],
    computedTypeRules: [v => v.length > 0 || "至少选择一种计算式"],
    question_list: [],
    timer: "",
    used_time: 0,
    examination: false,
    paused: false,
    finished: false,
    score: 0,
  }),
  methods: {
    print(){
      html2canvas(this.$refs.print_area).then(canvas=>{
        const url=canvas.toDataURL()
        // this.img=url
        printJS({
          printable:url,
          type:'image'
        })

        // printJS({
        //   printable:'form-content',
        //   type:'html',
        //   font_size:'14pt',
        //   style: style,
        //   targetStyles:['*'],
        //   maxWidth:1100,
        //   css: [
        //     "https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900",
        //     "https://cdn.jsdelivr.net/npm/@mdi/font@6.x/css/materialdesignicons.min.css",
        //     "https://cdn.jsdelivr.net/npm/vuetify@2.x/dist/vuetify.min.css",
        //     require("@/assets/print.css")
        //   ],
        // })
      })

    },
    formatSeconds(value) {
      let result = parseInt(value);
      let h =
        Math.floor(result / 3600) < 10
          ? "0" + Math.floor(result / 3600)
          : Math.floor(result / 3600);
      let m =
        Math.floor((result / 60) % 60) < 10
          ? "0" + Math.floor((result / 60) % 60)
          : Math.floor((result / 60) % 60);
      let s =
        Math.floor(result % 60) < 10
          ? "0" + Math.floor(result % 60)
          : Math.floor(result % 60);

      let res = "";
      if (h !== "00") res += `${h}时`;
      if (m !== "00") res += `${m}分`;
      res += `${s}秒`;
      return res;
    },
    randomNum(Min, Max) {
      var Range = Max - Min;
      var Rand = Math.random();
      return Min + Math.round(Rand * Range);
    },
    generateAdd() {
      let left, right;
      if (this.range_type == 1) {
        while (!left || !right || left + right > this.range) {
          left = this.randomNum(0, this.range);
          right = this.randomNum(0, this.range);
        }
      } else {
        while (!left || !right) {
          left = this.randomNum(0, this.range);
          right = this.randomNum(0, this.range);
        }
      }

      return [left, right];
    },
    generateSub() {
      let left, right;
      while (!left || !right || left - right < 0) {
        left = this.randomNum(0, this.range);
        right = this.randomNum(0, this.range);
      }
      return [left, right];
    },
    generateMulti() {
      let left, right;
      if (this.range_type == 1) {
        while (!left || !right || left * right > this.range) {
          left = this.randomNum(0, this.range);
          right = this.randomNum(0, this.range);
        }
      } else {
        while (!left || !right) {
          left = this.randomNum(0, this.range);
          right = this.randomNum(0, this.range);
        }
      }
      return [left, right];
    },
    generateDiv() {
      let left, right;
      while (!left || !right || left % right !== 0) {
        left = this.randomNum(0, this.range);
        right = this.randomNum(0, this.range);
      }
      return [left, right];
    },
    start() {
      this.finished = false;
      this.form_disabled = true;
      this.examination = true;
      this.used_time = 0;
      this.timer = setInterval(() => {
        this.used_time++;
      }, 1000);
    },
    pause() {
      clearInterval(this.timer);
      this.paused = true;
    },
    finish() {
      this.finished = true;
    },
    restart() {
      this.paused = false;
      this.timer = setInterval(() => {
        this.used_time++;
      }, 1000);
    },
    submitQuestion() {
      let ok =0;
      for (let index = 0; index < this.question_count; index++) {
        this.sendMessage(this.question_list[index], index);
        if (this.question_list[index].res){
          ok++;
        }
      }
      this.form_disabled = false;
      this.examination = false;
      this.score = ok / this.question_count * 100;
      this.finished = true;
      clearInterval(this.timer);
    },
    generateQuestion() {
      if (this.$refs.form.validate()) {
        this.question_list = [];
        for (let index = 0; index < this.question_count; index++) {
          let random_symbol_length = Math.floor(
            Math.random() * this.computed_type.length
          );
          let random_computed = this.computed_type[random_symbol_length];

          var res = this[this.random_computed_map[random_computed]]();
          var item = {
            left: res[0],
            right: res[1],
            symbol: random_computed,
            res: false
          };
          this.question_list.push(item);
          this.examination = false;
        }
      }
    },
    generateResult(item) {
      let left = item.left;
      let right = item.right;
      let symbol = item.symbol;
      let computed_res = item.computed_res;
      let res;
      switch (symbol) {
        case "add":
          res = left + right;
          break;
        case "sub":
          res = left - right;
          break;
        case "multi":
          res = left * right;
          break;
        case "div":
          res = left / right;
          break;
      }
      item.res = computed_res == res ? true : false;
      item.submit = true;
      return item;
    },
    // sendMessageEnter(el,index,item ){
    //   if (item.computed_res === undefined) {
    //     return;
    //   }
    //   this.question_list[index] = this.generateResult(item);
    // },
    sendMessage(item, index) {
      if (item.computed_res === undefined) {
        return;
      }
      this.question_list[index] = this.generateResult(item);
      this.$forceUpdate()
    }
  }
};
</script>
<style scoped>
.v-subheader {
  font-size: 1rem;
}
</style>
