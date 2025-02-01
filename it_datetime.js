class ITDatetime {
  getDate() {
    return this.dateFormate(new Date());
  }
  getTime() {
    return this.timeFormate(new Date());
  }

  // getDateSelect(){
  //   const today = new Date();
  //   let startDate, endDate;

  //   switch (range) {
  //     case "today":
  //       startDate = endDate = today;
  //       break;
  //     case "yesterday":
  //       startDate = endDate = new Date(today);
  //       startDate.setDate(today.getDate() - 1);
  //       break;
  //     case "thisWeek":
  //       const firstDayOfWeek = new Date(today);
  //       firstDayOfWeek.setDate(today.getDate() - today.getDay()); // วันจันทร์
  //       startDate = firstDayOfWeek;
  //       endDate = today;
  //       break;
  //     case "lastWeek":
  //       const lastWeekStart = new Date(today);
  //       lastWeekStart.setDate(today.getDate() - today.getDay() - 7); // วันจันทร์ของสัปดาห์ที่แล้ว
  //       startDate = lastWeekStart;
  //       endDate = new Date(lastWeekStart);
  //       endDate.setDate(lastWeekStart.getDate() + 6); // วันอาทิตย์ของสัปดาห์ที่แล้ว
  //       break;
  //     case "thisMonth":
  //       startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  //       endDate = today;
  //       break;
  //     case "lastMonth":
  //       const lastMonth = new Date(
  //         today.getFullYear(),
  //         today.getMonth() - 1,
  //         1
  //       );
  //       startDate = lastMonth;
  //       endDate = new Date(today.getFullYear(), today.getMonth(), 0); // วันสุดท้ายของเดือนที่แล้ว
  //       break;
  //     default:
  //       break;
  //   }
  // }
  
  getDate_yesterday() {
    const today = new Date();

    // สร้าง object วันที่สำหรับเมื่อวาน
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    return this.dateFormate(yesterday);
}
  dateFormate(dt) {
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, "0"); // เดือนจะเริ่มนับจาก 0
    const day = String(dt.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }
  timeFormate(dt) {
    let hours = dt.getHours();
    let minutes = dt.getMinutes();
    let seconds = dt.getSeconds();

    if (hours === 24) {
      hours = 0;
    }

    return [hours, minutes, seconds]
      .map((num) => String(num).padStart(2, "0"))
      .join(":");
  }
}
module.exports = new ITDatetime();
