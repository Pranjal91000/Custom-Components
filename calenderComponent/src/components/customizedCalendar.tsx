import { useEffect, useState, useRef } from "react";
import calendarLogo from "../assets/calendar_img.png";

const dateFormatter =(date: Date, formatType: string) =>{
    const dateMap = new Map([
        ["dd/mm/yyyy", 1],
        ["mm/dd/yyyy", 2],
        ["yyyy/mm/dd", 3],
        ["dd/mmm/yyyy",4],
        ["dd/mm/yy",5],
    ]);
    if(dateMap.has(formatType)){
        let type = dateMap.get(formatType);
        switch(type){
            case 1:
                return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth()+1).padStart(2, '0')}/${String(date.getFullYear()).padStart(4, '0')}`;
            case 2:
                return `${String(date.getMonth()+1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${String(date.getFullYear()).padStart(4, '0')}`;
            case 3:
                return `${String(date.getFullYear()).padStart(4, '0')}/${String(date.getMonth()+1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
            case 4:
                return `${String(date.getDate()).padStart(2, '0')}/${date.toLocaleDateString("en-US", { month: "narrow" })}/${String(date.getFullYear()).padStart(4, '0')}`; 
            case 5:
                return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth()+1).padStart(2, '0')}/${date.toLocaleDateString("en-US",{year: "2-digit"})}`;
        }

    }
    else{
        throw console.error("Supplied Date Format is not recognised");
    }
}

const CalendarComponent = ({ setDate="", handleChange, formatType="dd/mm/yyyy"}) => {
    if(setDate) {
        setDate=new Date(Number(setDate.split('/')[2]),Number(setDate.split('/')[1])-1,Number(setDate.split('/')[0]));
    }
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [edited, setEdited] = useState(false);
    const [view, setView] = useState("days"); // "days", "months", "years"
    const today = new Date();
    const [currDate, setCurrDate] = useState(setDate || today);
    const [selectedDate, setSelectedDate] = useState(setDate || today);
    const calendarRef = useRef(null);
    const updateCalendarVisibility = () => {
        setCalendarVisible(!calendarVisible);
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target)) {
                setCalendarVisible(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        let date = dateFormatter(selectedDate, formatType);
       if(edited){
        console.log("Returning Date: ",date);
        //handleChange(date);
       } 
       setCalendarVisible(false);
    }, [selectedDate]);
    

    return (
        <div  ref={calendarRef}>
            <div className="input-container">
                <label className="input-label">Document Date</label>
                <input 
                    id="calendar-val" 
                    type="text" 
                    onClick={() => setCalendarVisible(true)} 
                    readOnly 
                    value={ edited ? (`${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`) : ""} 
                />
                <button id="calendarBtn" onClick={updateCalendarVisibility}>
                    <img src={calendarLogo} alt="Calendar Icon" />
                </button>
            </div>
            
            {calendarVisible && (
                <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
                    <CalendarDate today={today} />
                    {view === "days" && <DaysView currDate={currDate} selectedDate={selectedDate} setSelectedDate={setSelectedDate} setView={setView} setCurrDate={setCurrDate} setEdited={setEdited}/>}
                    {view === "months" && <MonthsView setCurrDate={setCurrDate} setView={setView} currDate={currDate} />}
                    {view === "years" && <YearsView setCurrDate={setCurrDate} setView={setView} currDate={currDate}/>}
                </div>
            )}
        </div>
    );
};

const CalendarDate = ({ today }) => {
    return (
        <div className="calendar-todayDate">
            <div className="leftAlign">
                {today.toLocaleDateString("en-US", { weekday: "long" })}, {today.getDate()} {today.toLocaleDateString("en-US", { month: "long" })}
            </div>
        </div>
    );
};

const DaysView = ({ currDate, selectedDate, setSelectedDate, setView, setCurrDate, setEdited }) => {
    const firstDayOfMonth = new Date(currDate.getFullYear(), currDate.getMonth(), 1).getDay();
    const lastDateOfMonth = new Date(currDate.getFullYear(), currDate.getMonth() + 1, 0).getDate();
    const lastDateOfPrevMonth = new Date(currDate.getFullYear(), currDate.getMonth(), 0).getDate();

    // Generate previous month days
    const previousMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => ({
        day: lastDateOfPrevMonth - firstDayOfMonth + 1 + i,
        month: currDate.getMonth() - 1 < 0 ? 11 : currDate.getMonth() - 1,
        year: currDate.getMonth() - 1 < 0 ? currDate.getFullYear() - 1 : currDate.getFullYear(),
        type: "prev"
    }));

    // Generate current month days
    const currentMonthDays = Array.from({ length: lastDateOfMonth }, (_, i) => ({
        day: i + 1,
        month: currDate.getMonth(),
        year: currDate.getFullYear(),
        type: "current"
    }));

    // Generate next month days
    const remainingDays = 42 - (previousMonthDays.length + currentMonthDays.length);
    const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => ({
        day: i + 1,
        month: currDate.getMonth() + 1 > 11 ? 0 : currDate.getMonth() + 1,
        year: currDate.getMonth() + 1 > 11 ? currDate.getFullYear() + 1 : currDate.getFullYear(),
        type: "next"
    }));

    // Merge all days and group into weeks (2D array)
    const allDays = [...previousMonthDays, ...currentMonthDays, ...nextMonthDays];
    const weeks = [];
    while (allDays.length) weeks.push(allDays.splice(0, 7));

    return (
        <>
        <div className="calendar-header">
            <div className="leftAlign navigation-info">
                <span onClick={() => setView("months")}>{currDate.toLocaleDateString("en-US", { month: "long" })},{currDate.getFullYear()}</span>
            </div>
            <div className="rightAlign">
                <button className="navigation" onClick={() => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() - 1, 1))}>▲</button>
                <button className="navigation" onClick={() => setCurrDate(new Date(currDate.getFullYear(), currDate.getMonth() + 1, 1))}>▼</button>
            </div>
        </div>
        <div className="calendar-grid">
            <div className="weekdays">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="weekday">{day}</div>
                ))}
            </div>
            <div className="days">
                {weeks.map((week, rowIndex) => (
                    <div key={rowIndex} className="week-row">
                        {week.map((dateObj, colIndex) => (
                            <div
                                key={colIndex}
                                className={[
                                    "day",
                                    dateObj.type === "prev" ? "prev-month" : "",
                                    dateObj.type === "next" ? "next-month" : "",
                                    dateObj.type === "current" && new Date(dateObj.year, dateObj.month, dateObj.day).toDateString() === selectedDate.toDateString() ? "selected" : "",
                                ].filter(Boolean).join(" ")}
                                onClick={()=>{
                                    setEdited(true);
                                    setCurrDate(new Date(dateObj.year, dateObj.month, dateObj.day)),
                                    setSelectedDate(new Date(dateObj.year, dateObj.month, dateObj.day))
                                }}
                            >
                                {dateObj.day}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
        </>
    );
};

const MonthsView = ({ setCurrDate, setView, currDate }) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return (
        <>
            <div className="calendar-header">
            <div className="leftAlign navigation-info">
                <span onClick={() => setView("years")}> {currDate.getFullYear()}</span>
            </div>
            <div className="rightAlign">
                <button className="navigation" onClick={() => setCurrDate(new Date(currDate.getFullYear() - 1, 1))}>▲</button>
                <button className="navigation" onClick={() => setCurrDate(new Date(currDate.getFullYear() + 1, 1))}>▼</button>
            </div>
        </div>
            <div className="months-grid">
            {months.map((month, index) => (
                <div key={index} className="month" onClick={() => { setCurrDate(new Date(currDate.getFullYear(), index, 1)); setView("days"); }}>
                    {month}
                </div>
            ))}
            </div>
        </>
        
    );
};

const YearsView = ({ setCurrDate, setView, currDate }) => {
    let startYear = currDate.getFullYear()-6;
    let years = Array.from({ length: 12 }, (_, i) => startYear + i);
    return (
        <>
            <div className="calendar-header">
            <div className="navigation-info">
                {years[0]} - {years[11]}
            </div>
            <div className="rightAlign">
                <button className="navigation" onClick={() => setCurrDate(new Date(currDate.getFullYear() - 10, 1))}>▲</button>
                <button className="navigation" onClick={() => setCurrDate(new Date(currDate.getFullYear() + 10, 1))}>▼</button>
            </div>
        </div>
        <div className="years-grid">
            {years.map((year) => (
                <div key={year} className="year" onClick={() => { setCurrDate(new Date(year, 0, 1)); setView("months"); }}>
                    {year}
                </div>
            ))}
        </div>
        </>
        
    );
};

export default CalendarComponent;
