import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
// import { getAPIEndpoint } from '../../../services/apiService';
import { CacheService } from '../../../services/cacheService';

interface Suggestion {
    id: number;
    [key: string]: string | number;
}

interface Column {
    name: string,
    label: string
}

/**
 * UCInputSuggestions Component
 * 
 * A React functional component that provides input suggestions based on user input.
 * 
 * @param {Function} onSelect - Callback function triggered on selecting a suggestion.
 * @param {string} [showColumns] - Key of the column to display in the input after selection.
 * @param {boolean} [inGrid] - If true, show suggestions in a grid view, else show in a list view.
 */
const UCInputSuggestions: React.FC<{ onSelect: (suggestion: Suggestion) => void, showColumns?: string, inGrid?: boolean, code?: string, defaultValue?: string, inputPlaceHolder?: string, className?: string, onBlur?: () => void, tabIndex?: number }> 
    = ({ onSelect, showColumns, inGrid = false, code, defaultValue = "", inputPlaceHolder = "Search an item...", className, onBlur, tabIndex }) => 
    {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [tempSuggestions, setTempSuggestions] = useState<Suggestion[]>([]);
    const [displayColumns, setDisplayColumns] = useState<Column[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [inputValue, setInputValue] = useState<string>(defaultValue || '');
    const [currentFocus, setCurrentFocus] = useState<number>(-1);
    const inputRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        console.log("code", code);
        fetchSuggestions();
    }, []);

    useEffect(() => {
        handleDefaultValueChange();
    }, [defaultValue]);

    const fetchSuggestions = async () => {
        if (isLoading) {
            return;
        }
    
        setIsLoading(true);
        try {
            if (code) { // Add a null check here
                const response = await CacheService.get(code?.toString());
                const parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
                if (parsedResponse?.length) {
                    let displayColumns = Object.keys(parsedResponse[0]).map((key: string) => ({ name: key, label: key }));
                    setDisplayColumns(displayColumns); // Set the columns of the table
                    setTempSuggestions(parsedResponse); // Set the temporary data of the table
                }
                // const endpoint = await getAPIEndpoint(code);
                // const response = await fetch(endpoint);
                // const data = await response.json();
                // const getDisplayColumns = data?.displayColumns;
                // setDisplayColumns(getDisplayColumns);
                // setTempSuggestions(data.RowsData);
                handleDefaultValueChange();
            } else {
                console.error('Code is undefined');
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDefaultValueChange = async() =>{
        if(displayColumns.length > 0){
            // Check if defaultValue belongs to any of the columns
            const defaultSuggestion = tempSuggestions?.find((suggestion: Suggestion) =>
                Object.values(suggestion).some(value => value === defaultValue)
            );

            if (defaultValue === "") {
                setInputValue("");
            } else if (defaultSuggestion && showColumns) {
                setInputValue(defaultSuggestion[showColumns].toString());
            }
        }
    }

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const query = e.target.value;
        setInputValue(query);

        if (!query) {
            setSuggestions([]);
            return;
        }

        const filteredData = tempSuggestions.filter(item =>
            Object.values(item).some(value =>
                value.toString().toLowerCase().includes(query.toLowerCase())
            )
        );

        setSuggestions(filteredData);
        setCurrentFocus(-1);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.keyCode === 40) { // Arrow Down
            setCurrentFocus((prev) => (prev + 1) % suggestions.length);
        } else if (e.keyCode === 38) { // Arrow Up
            setCurrentFocus((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.keyCode === 13) { // Enter
            if (currentFocus >= 0) {
                const selectedSuggestion = suggestions[currentFocus];
                onSelect(selectedSuggestion);
                const selectedValue = showColumns ? selectedSuggestion[showColumns] : Object.values(selectedSuggestion).join(', ');
                setInputValue(selectedValue.toString());
                setSuggestions([]);
            }
        }
    };

    const handleSuggestionClick = (suggestion: Suggestion) => {
        onSelect(suggestion);
        const selectedValue = showColumns ? suggestion[showColumns] : Object.values(suggestion).join(', ');
        setInputValue(selectedValue.toString());
        setSuggestions([]);
    };

    const closeSuggestions = (e: MouseEvent): void => {
        if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
            setSuggestions([]);
        }
    };

    useEffect(() => {
        document.addEventListener('click', closeSuggestions);
        return () => {
            document.removeEventListener('click', closeSuggestions);
        };
    }, []);

    return (
        <>
            <div  ref={inputRef} className={`${className ? className + ' ' : ''} autocomplete`}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onBlur={onBlur}
                    placeholder={inputPlaceHolder}
                    tabIndex = {tabIndex}
                    autoComplete='new-password'
                    className={"border-2 border-gray-300 px-2 py-1 rounded-md w-full"}
                />
                {suggestions.length > 0 && (
                    <div className="autocomplete-items shadow absolute min-w-[180px] bg-white z-100">
                        {inGrid ? (
                            <table className="min-w-full bg-white">
                                <thead>
                                    <tr className="w-full border border-gray-400 text-white bg-gray-600">
                                        {displayColumns.filter(key => key?.name?.toLowerCase() !== 'id').map((key, index) => (
                                            <th key={index} className="text-[14px] px-4 py-2 text-left">{key.label}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {suggestions.map((suggestion, index) => (
                                        <tr
                                            key={index}
                                            className={`cursor-pointer ${currentFocus === index ? 'bg-blue-400 text-white' : ''}`}
                                            data-id={suggestion?.id?.toString()}
                                            onClick={() => { handleSuggestionClick(suggestion) }}
                                        >
                                            {displayColumns.map((column, index) => (
                                                <td key={index} className="border-b border-gray-400 px-4 py-2 text-[14px]">{suggestion[column.name]}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <ul className="list-none">
                                {suggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        className={`cursor-pointer ${currentFocus === index ? 'bg-blue-400 text-white' : ''} border-b border-gray-400 px-4 py-2`}
                                        data-id={suggestion?.id?.toString()}
                                        onClick={() => { handleSuggestionClick(suggestion) }}
                                    >
                                        {displayColumns.filter(column => column?.name?.toLowerCase() !== 'id').map((column, index2) => (
                                            <span key={index2} className={`${index2 === 0 ? 'font-bold text-[16px]' : 'font-normal'} text-[12px]`}>
                                                {suggestion[column.name]}
                                                {index2 !== displayColumns.filter((column) => column?.name?.toLowerCase() !== 'id').length - 1 && <span style={{ margin: '0 4px' }}><br /></span>}
                                            </span>
                                        ))}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default UCInputSuggestions;

